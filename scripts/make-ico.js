const sharp = require('sharp');
const fs = require('fs');
const pngToIco = require('png-to-ico');

(async () => {
  const base = 'resources/icons/app-icon.png'; // source PNG
  const sizes = [16,32,48,64,128,256];
  const outs = [];
  for (const s of sizes) {
    const out = `resources/icons/tmp-${s}.png`;
    await sharp(base).resize(s, s).png().toFile(out);
    outs.push(out);
  }
  const buf = await pngToIco(outs);
  fs.writeFileSync('resources/icons/app-icon.ico', buf);
  console.log('ICO written.');
})();
