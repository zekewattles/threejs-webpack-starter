const root = document.documentElement;
const calcRange = (min, max, percent) => percent * (max - min) + min;

// scroll hue
document.addEventListener("scroll", (e) => {
  const range = calcRange(0, 360, window.scrollY / document.body.clientHeight);
  root.style.setProperty("--color-accent-hue", Math.floor(range));

  // scroll hue inverse
  const rangeInverted =
    (calcRange(0, 360, window.scrollY / document.body.clientHeight) + 180) %
    360;
  root.style.setProperty(
    "--color-accent-hue-inverse",
    Math.floor(rangeInverted)
  );

  console.log({ range, rangeInverted });
});
