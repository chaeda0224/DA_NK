from __future__ import annotations

import argparse
import json
import os
from pathlib import Path

from .dataset import build_layout_dataset


PROJECT_ROOT = Path(os.environ.get("DA_NK_ROOT", Path.cwd())).resolve()


def profile_paths() -> list[Path]:
    return sorted((PROJECT_ROOT / "connectors").glob("*/ocr/profile.json"))


def load_profile(value: str) -> dict:
    direct = Path(value)
    path = direct if direct.exists() else PROJECT_ROOT / "connectors" / value / "ocr" / "profile.json"
    if not path.exists():
        raise ValueError(f"OCR profile not found: {value}")
    return json.loads(path.read_text(encoding="utf-8"))


def command_profiles(_: argparse.Namespace) -> None:
    for path in profile_paths():
        profile = json.loads(path.read_text(encoding="utf-8"))
        print(
            f"{profile['profile_id']}: {profile['display_name']} "
            f"({profile['document_family']}, {profile['status']})"
        )


def command_build_layout(args: argparse.Namespace) -> None:
    profile = load_profile(args.profile)
    overrides = None
    if args.metadata_overrides:
        payload = json.loads(args.metadata_overrides.read_text(encoding="utf-8"))
        overrides = payload["articles"]
    result = build_layout_dataset(
        args.annotations,
        args.images,
        args.output,
        profile,
        metadata_overrides=overrides,
    )
    print(json.dumps({
        "pages": result.pages,
        "instances": result.instances,
        "output": str(result.output),
        "profile": profile["profile_id"],
    }, ensure_ascii=False))


def main() -> None:
    parser = argparse.ArgumentParser(prog="nk-ocr-kit")
    sub = parser.add_subparsers(required=True)
    profiles = sub.add_parser("profiles", help="List connector-owned OCR profiles")
    profiles.set_defaults(handler=command_profiles)
    build = sub.add_parser("build-layout-dataset", help="Export reviewed pages to YOLO labels")
    build.add_argument("--profile", default="rodong")
    build.add_argument("--annotations", type=Path, required=True)
    build.add_argument("--images", type=Path, required=True)
    build.add_argument("--output", type=Path, required=True)
    build.add_argument("--metadata-overrides", type=Path)
    build.set_defaults(handler=command_build_layout)
    args = parser.parse_args()
    args.handler(args)


if __name__ == "__main__":
    main()
