import hashlib
import json
import sys
import tempfile
import unittest
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "workers" / "ocr"))
from nk_ocr_kit.dataset import build_layout_dataset

class DatasetExportTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)
        self.annotations = self.root / "annotations"
        self.images = self.root / "images"
        self.annotations.mkdir()
        self.images.mkdir()
        Image.new("RGB", (1162, 1604), "white").save(self.images / "page-01.png")
        self.truth = {
            "issue_id": "rodong-2026-01-01", "page": 1, "annotation_source": "synthetic-test",
            "articles": [{
                "article_id": "rodong-2026-01-01-p01-a001", "canonical_title": "직접 만든 예제 제목",
                "article_type": "example", "bbox_pdf": [10, 20, 200, 300],
                "headline_regions_pdf": {"main": [10, 20, 200, 60], "subtitles": []},
            }],
        }
        self.path = self.annotations / "p01_article_ground_truth.json"
        self.profile = json.loads((ROOT / "connectors/rodong/ocr/profile.json").read_text(encoding="utf-8"))

    def export(self):
        self.path.write_text(json.dumps(self.truth, ensure_ascii=False), encoding="utf-8")
        return build_layout_dataset(self.annotations, self.images, self.root / "output", self.profile)

    def test_export_keeps_relative_paths_hash_and_yolo_geometry(self):
        result = self.export()
        self.assertEqual((result.pages, result.instances), (1, 2))
        manifest = json.loads((result.output / "manifest.jsonl").read_text(encoding="utf-8"))
        self.assertEqual(manifest["image"], "page-01.png")
        self.assertEqual(manifest["image_sha256"], hashlib.sha256((self.images / "page-01.png").read_bytes()).hexdigest())
        labels = (result.output / manifest["label"]).read_text().splitlines()
        self.assertEqual(len(labels), 2)
        for line in labels:
            self.assertTrue(all(0 <= float(value) <= 1 for value in line.split()[1:]))
        with self.assertRaises(FileExistsError):
            self.export()

    def test_corrupted_title_is_rejected(self):
        self.truth["articles"][0]["canonical_title"] = "Ãbad"
        with self.assertRaisesRegex(ValueError, "mojibake"):
            self.export()

    def test_missing_image_is_rejected(self):
        (self.images / "page-01.png").unlink()
        with self.assertRaisesRegex(ValueError, "exactly one"):
            self.export()

if __name__ == "__main__":
    unittest.main()
