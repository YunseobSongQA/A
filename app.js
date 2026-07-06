// 기능 1: PRD 입력받기

// 화면 요소 찾기
const input = document.querySelector("#prd-input");
const button = document.querySelector("#read-btn");
const output = document.querySelector("#output");

// 버튼을 누르면 입력창 글자를 읽어와 화면에 보여주기
button.addEventListener("click", () => {
  const prdText = input.value; // 입력창 글자 가져오기
  output.textContent = prdText; // 읽은 값 확인
});
