// 기획서(pptx) 안의 슬라이드 글자를 읽어온다

// pptx 안에서 슬라이드 XML 경로만 골라 화면 순서대로 정렬한다
const slidePaths = (zip) => {
  console.log("[slidePaths] zip:", zip);
  const all = Object.keys(zip.files);
  const slides = all.filter((path) => /^ppt\/slides\/slide\d+\.xml$/.test(path));
  const sorted = slides.sort((a, b) => a.localeCompare(b, undefined, { numeric: true })); // slide2가 slide10보다 앞
  console.log("[slidePaths] sorted:", sorted);
  return sorted;
};

// 슬라이드 1장의 글자. DOMParser가 &amp; 같은 엔티티도 풀어준다
const readSlideText = async (zip, path) => {
  console.log("[readSlideText] path:", path);
  const xml = await zip.file(path).async("text");
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  if (doc.querySelector("parsererror")) {
    throw new Error(`${path} XML이 깨졌습니다`);
  }
  // 문단(a:p) = 표의 셀 1칸 / 글머리 1줄. 문단별로 끊어야 요구사항 표의 행들이 한 덩어리로 뭉개지지 않는다
  const paragraphs = [...doc.getElementsByTagName("a:p")];
  const lines = paragraphs.map((paragraph) => {
    const textNodes = [...paragraph.getElementsByTagName("a:t")]; // <a:t>안녕</a:t> 안의 글자
    const texts = textNodes.map((node) => node.textContent);
    return texts.join("");
  });
  const filled = lines.filter((line) => line.trim() !== ""); // 빈 문단은 버린다
  const text = filled.join("\n");
  console.log("[readSlideText] text:", text);
  return text;
};

const readSlides = async (file) => {
  console.log("[readSlides] file:", file);
  const zip = await JSZip.loadAsync(file);
  const paths = slidePaths(zip);
  const slides = await Promise.all(paths.map((path) => readSlideText(zip, path)));
  console.log("[readSlides] slides:", slides);
  return slides;
};

export { readSlides };
