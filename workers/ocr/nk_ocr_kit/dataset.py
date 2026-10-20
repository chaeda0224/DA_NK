"""Export reviewed page annotations to a portable layout-training dataset."""

from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass
from pathlib import Path

from PIL import Image


@dataclass(frozen=True)
class DatasetResult:
    pages: int
    instances: int
    output: Path


def _find_page_image(image_root: Path, issue_id: str, page: int) -> Path:
    issue_date = issue_id.removeprefix("rodong-")
    issue_root = image_root / issue_date
    search_root = issue_root if issue_root.exists() else image_root
    candidates = sorted(search_root.rglob(f"page-{page:02d}.jpeg"))
    candidates += sorted(search_root.rglob(f"page-{page:02d}.jpg"))
    candidates += sorted(search_root.rglob(f"page-{page:02d}.png"))
    if len(candidates) != 1:
        raise ValueError(
            f"Expected exactly one page-{page:02d} image under {image_root}; "
            f"found {len(candidates)}"
        )
    return candidates[0]


def _scale_box(box: list[float] | None, scale: tuple[float, float]) -> list[float] | None:
    if box is None:
        return None
    return [box[0] * scale[0], box[1] * scale[1], box[2] * scale[0], box[3] * scale[1]]


def _to_yolo(label: str, box: list[float], width: int, height: int, classes: list[str]) -> str:
    x1, y1, x2, y2 = box
    center_x, center_y = ((x1 + x2) / 2) / width, ((y1 + y2) / 2) / height
    box_width, box_height = (x2 - x1) / width, (y2 - y1) / height
    return (
        f"{classes.index(label)} {center_x:.8f} {center_y:.8f} "
        f"{box_width:.8f} {box_height:.8f}"
    )


def _looks_mojibake(value: str) -> bool:
    text = str(value or "")
    has_hangul = any("\uac00" <= character <= "\ud7a3" for character in text)
    suspicious = any(character in text for character in ("Ã", "Â", "ì", "ë", "í", "ã", "ð", "ƒ"))
    return suspicious or (bool(text) and not has_hangul and any(ord(character) > 127 for character in text))


def build_layout_dataset(
    annotation_dir: Path,
    image_root: Path,
    output_dir: Path,
    profile: dict,
    metadata_overrides: dict | None = None,
) -> DatasetResult:
    """Create YOLO labels and a relocatable JSONL provenance manifest."""
    truth_paths = sorted(annotation_dir.glob("p??_article_ground_truth.json"))
    if not truth_paths:
        raise ValueError(f"No reviewed ground-truth files in {annotation_dir}")
    if output_dir.exists():
        raise FileExistsError(f"Output already exists: {output_dir}")

    classes = list(profile["annotation_classes"])
    labels_dir = output_dir / "labels"
    labels_dir.mkdir(parents=True)
    manifests: list[dict] = []
    instances = 0

    for truth_path in truth_paths:
        truth = json.loads(truth_path.read_text(encoding="utf-8"))
        page = int(truth["page"])
        image_path = _find_page_image(image_root, truth["issue_id"], page)
        with Image.open(image_path) as image:
            width, height = image.size
        scale = (width / 1161.95, height / 1604.12)
        labels: list[str] = []
        manifest_articles = []

        for article in truth["articles"]:
            override = (metadata_overrides or {}).get(article["article_id"], {})
            title = override.get("title", article["canonical_title"])
            subtitles = override.get("subtitles", article.get("subtitles", []))
            if _looks_mojibake(title) or any(_looks_mojibake(value) for value in subtitles):
                raise ValueError(
                    f"Likely mojibake in reviewed metadata for {article['article_id']}. "
                    "Repair the annotation source or provide --metadata-overrides."
                )
            regions = article["headline_regions_pdf"]
            article_boxes = [("article", _scale_box(article["bbox_pdf"], scale))]
            if regions.get("main"):
                article_boxes.append(("title", _scale_box(regions["main"], scale)))
            article_boxes.extend(
                ("subtitle", _scale_box(box, scale))
                for box in regions.get("subtitles", [])
            )
            for media in article.get("embedded_media", []):
                if media.get("media_type") == "photo" and media.get("bbox_image"):
                    article_boxes.append(("photo", media["bbox_image"]))
            for label, box in article_boxes:
                if box is None or label not in classes:
                    continue
                labels.append(_to_yolo(label, box, width, height, classes))
                instances += 1
            manifest_articles.append({
                "article_id": article["article_id"],
                "type": article["article_type"],
                "title": title,
                "subtitles": subtitles,
                "bbox_pdf": article["bbox_pdf"],
            })

        label_name = f"{truth['issue_id']}-p{page:02d}.txt"
        label_path = labels_dir / label_name
        label_path.write_text("\n".join(labels) + "\n", encoding="utf-8")
        manifests.append({
            "issue_id": truth["issue_id"],
            "page": page,
            "profile": profile["profile_id"],
            "image": image_path.relative_to(image_root).as_posix(),
            "image_path_base": "images_argument",
            "image_sha256": hashlib.sha256(image_path.read_bytes()).hexdigest(),
            "image_size": [width, height],
            "label": f"labels/{label_name}",
            "articles": manifest_articles,
            "annotation_source": truth["annotation_source"],
            "metadata_overrides_applied": bool(metadata_overrides),
        })

    (output_dir / "manifest.jsonl").write_text(
        "\n".join(json.dumps(row, ensure_ascii=False) for row in manifests) + "\n",
        encoding="utf-8",
    )
    (output_dir / "dataset.json").write_text(
        json.dumps({
            "schema": "nk-ocr-layout-dataset/v1",
            "profile": profile["profile_id"],
            "classes": classes,
            "pages": len(manifests),
            "instances": instances,
            "split_policy": "Split by issue date, never by page crop.",
            "path_contract": "Manifest image paths are relative to --images; labels are relative to the dataset root.",
        }, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    return DatasetResult(pages=len(manifests), instances=instances, output=output_dir)
