# DA_NK

한국어 문헌의 검색과 검수된 OCR 주석 처리를 위한 로컬 도구입니다.
DA_NK 작업 프로젝트에서 검색·문헌 모델·주석 내보내기 코어를 분리한 첫 공개판입니다.
현재 단계는 실험용 알파입니다.

## 실행해 보기

Node.js 20 이상에서 실행합니다. 검색 예제는 외부 패키지 설치나 계정 없이 동작합니다.

```sh
git clone https://github.com/chaeda0224/DA_NK.git
cd DA_NK
npm run demo
npm test
npm start
```

서버는 `http://127.0.0.1:4173`에서 실행합니다. Windows PowerShell 실행 정책이
`npm`을 차단하면 `npm.cmd`를 사용합니다. 서버 종료는 `Ctrl+C`입니다.

```text
GET /health
GET /search?q=검색어&limit=20
GET /search?q=검색어&dataset_id=synthetic-demo&document_type=example-note
```

`npm run demo`는 직접 작성한 예제 2건에서 `2026년 1월 러시아 문헌 찾아줘`를 검색합니다.
검색 결과에는 문서 식별자, 근거 구절, 쪽수, 출처 참조가 포함됩니다.
예제의 제목·본문·날짜는 기능 확인용이며 실제 신문 기사나 연구 근거가 아닙니다.
`example:` 출처 참조는 예제 식별자이며 다운로드할 원문 링크가 아닙니다.

자기 코퍼스를 연결하려면 `examples/search-corpus.json`의 구조를 참고합니다.

```sh
npm start -- --corpus=path/to/search-corpus.json --port=4174
```

## 포함된 기능

- 한국어 연·월 조건, 유니코드 정규화와 `러시아` / `로씨야` 표기 확장
- 문서·자료원·문헌 유형 필터와 근거 구절을 반환하는 로컬 검색 API
- 출처·텍스트 버전을 보존하는 문헌 변환 도구와 Rodong 문헌 스키마
- 사람이 검수한 기사·제목 영역을 YOLO 라벨과 상대경로 manifest로 내보내는 Python 작업기

검색기는 규칙과 문자열 일치를 사용합니다. 일반적인 자연어 질의 이해나 의미 검색을
제공하지 않으며, 여러 단어를 포함한 질의는 연결된 구절로 처리됩니다.
검색 API는 메모리에 코퍼스를 읽고 `total`을 정수로 반환합니다.

## OCR 주석 내보내기

Python 3.10 이상과 Pillow가 필요합니다.

```sh
npm run ocr:setup
npm run ocr:profiles
npm run test:ocr
npm run ocr:build-layout -- --profile rodong --annotations path/to/annotations --images path/to/images --output path/to/new-output
```

이 작업기는 이미 검수된 주석과 이미지를 입력받습니다. PDF 문자 인식, 기사 자동 분할,
OCR 모델 학습은 실행하지 않습니다. 입력 형식은 [주석 형식 안내](docs/annotation-format.md)에 있습니다.
이미지 해시, 원문 영역, 주석 출처를 보존하며 기존 출력 폴더를 덮어쓰지 않습니다.
지면 좌표 기준은 현재 `1161.95 × 1604.12`로 고정돼 있습니다. 다른 지면의 좌표는 변환이 필요합니다.

## 공개 범위와 제한

이 저장소에는 원문 PDF·이미지·기사 수집본, 운영 데이터베이스, 개인 설정, 모델 가중치,
전체 뷰어·연구 아카이브 화면이 포함되지 않습니다. 실제 자료는 사용자가 별도로 준비합니다.
제공하는 Rodong 스키마와 프로필은 초기 자료원에 특화돼 있습니다.
다른 자료원의 검증 규칙과 좌표 체계는 별도 확장이 필요합니다.
서버는 로컬 단일 사용자 실행을 전제로 하며 인증·공개 배포 기능이 없습니다.

코드와 직접 작성한 예제는 [MIT License](LICENSE)를 따릅니다.
외부 의존성과 사용자가 추가하는 자료의 이용 조건은 [의존성과 자료 범위](THIRD_PARTY_NOTICES.md)를 참고합니다.
기여 방법은 [CONTRIBUTING.md](CONTRIBUTING.md)에 있습니다.
