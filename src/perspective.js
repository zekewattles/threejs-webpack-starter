// rotation
const root = document.documentElement;
const inputs = {
  perspective: document.getElementById("perspective"),
  textDistance: document.getElementById("textDistance"),
};
const calcRange = (min, max, percent) => percent * (max - min) + min;
const update = (clientX, clientY) => {
  const xPercent = clientX / window.innerWidth;
  const yPercent = clientY / window.innerHeight;
  const rotateSpit = `${calcRange(20, -20, yPercent)}deg`;
  const rotatePost = `${calcRange(-45, 45, xPercent)}deg`;
  root.style.setProperty("--rotateX", rotateSpit);
  root.style.setProperty("--rotateY", rotatePost);
};
document.addEventListener("mousemove", (e) => {
  const { clientX, clientY } = e;
  update(clientX, clientY);
});

// scroll hue
document.addEventListener("scroll", (e) => {
  const range = calcRange(0, 360, window.scrollY / document.body.clientHeight);
  root.style.setProperty("--color-accent-hue", Math.floor(range));
  // scroll hue inverse
  const rangeInverted = (calcRange(0, 360, window.scrollY / document.body.clientHeight) + 180) % 360;
  root.style.setProperty("--color-accent-hue-inverse", Math.floor(rangeInverted));
});

// controls
Object.keys(inputs).forEach((key) => {
  inputs[key].addEventListener("input", (e) => {
    let { value } = e.target;
    const name = `--${key}`;
    if (["perspective", "textDistance"].includes(key)) value = `${value}px`;
    root.style.setProperty(name, value);
  });
});

// controls toggle
const toggleElement = document.getElementById("toggle");
const controlsElement = document.getElementById("controls");
const editableElements = document.querySelectorAll("[data-editable]");
const toggleControls = (event) => {
  event.preventDefault();
  controlsElement.classList.toggle("is-hidden");
  editableElements.forEach((element) => {
    element.setAttribute(
      "contenteditable",
      !controlsElement.classList.contains("is-hidden")
    );
  });
};
toggleElement.addEventListener("click", toggleControls);
