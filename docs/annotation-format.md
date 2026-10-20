# OCR 검수 주석 입력

`--annotations` 폴더에는 `p01_article_ground_truth.json`처럼 `p??_article_ground_truth.json`에
맞는 이름의 JSON 파일을 둡니다. 아래 내용은 직접 작성한 가상 예제입니다.

```json
{
  "issue_id": "rodong-2026-01-01",
  "page": 1,
  "annotation_source": "synthetic-example",
  "articles": [{
    "article_id": "rodong-2026-01-01-p01-a001",
    "article_type": "example",
    "canonical_title": "직접 만든 예제 제목",
    "subtitles": [],
    "bbox_pdf": [10, 20, 200, 300],
    "headline_regions_pdf": {"main": [10, 20, 200, 60], "subtitles": []}
  }]
}
```

이미지 이름은 `page-01.png`, `page-01.jpg` 또는 `page-01.jpeg`입니다.
`--images` 아래에 날짜 폴더 `2026-01-01/`가 있으면 그 폴더에서 찾습니다.
같은 쪽에 해당하는 이미지가 없거나 두 개 이상이면 작업을 중단합니다.
영역 좌표는 `[x1, y1, x2, y2]`이며 현재 기준 지면 크기는 `1161.95 × 1604.12`입니다.
실제 이미지 크기에 맞춰 좌표를 환산합니다.

결과는 `dataset.json`, `manifest.jsonl`, `labels/*.txt`입니다.
원본 이미지는 복사하지 않습니다. manifest의 이미지 경로는 `--images` 기준,
라벨 경로는 출력 폴더 기준 상대경로입니다. 학습·검증 분리는 수행하지 않습니다.
지면·기사별 자료 누출을 피하도록 별도로 분리해야 합니다.

문자가 깨진 제목이 있으면 중단합니다. 명시적인 교정은
`--metadata-overrides path/to/corrections.json`으로 지정합니다.
교정 파일 형식은 `{"articles": {"기사ID": {"title": "교정 제목", "subtitles": []}}}`입니다.
검증 실패 후에는 출력 폴더 일부가 남을 수 있으므로 새 출력 경로로 재시도합니다.
