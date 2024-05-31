export function randomColor() {
  const minRGBValue = 100;
  const red = Math.floor(Math.random() * (256 - minRGBValue) + minRGBValue);
  const green = Math.floor(Math.random() * (256 - minRGBValue) + minRGBValue);
  const blue = Math.floor(Math.random() * (256 - minRGBValue) + minRGBValue);
  const darkColor = `#${red.toString(16).padStart(2, '0')
    }${green.toString(16).padStart(2, '0')
    }${blue.toString(16).padStart(2, '0')}`;
  return darkColor;
}

export function chooseTextColor(colorCode) {
  const red = parseInt(colorCode.substr(1, 2), 16);
  const green = parseInt(colorCode.substr(3, 2), 16);
  const blue = parseInt(colorCode.substr(5, 2), 16);
  const luminance = (0.299 * red + 0.587 * green + 0.114 * blue) / 255;
  if (luminance > 0.5) return 'black';
  else return 'white';
}
