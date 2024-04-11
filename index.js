const express = require('express');
const multer = require('multer');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/uploads', express.static('uploads')); 

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads');
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

app.post('/barang/simpan', upload.single('gambar'), (req, res) => {
  fs.readFile('data.json', (err, existingData) => {
    let newData = [];
    let lastCode = 0;
    let prefix = '';

    if (!err && existingData.length) {
      newData = JSON.parse(existingData);

      // Tentukan prefix berdasarkan jenis barang
      switch (req.body.jenis) {
        case 'makanan':
          prefix = 'M';
          break;
        case 'hewan':
          prefix = 'H';
          break;
        case 'tumbuhan':
          prefix = 'T';
          break;
        case 'barang':
          prefix = 'B';
          break;
      }

      const lastItem = newData.filter(item => item.kode && item.kode.startsWith(prefix)).pop();
      if (lastItem) {
        lastCode = parseInt(lastItem.kode.substring(1)) || 0;
      }
    }

    // Buat kode barang baru
    const newCode = prefix + String(lastCode + 1).padStart(3, '0');

    const data = {
      kode: newCode,
      nama: req.body.nama,
      hargaDasar: req.body.hargaDasar,
      jenis: req.body.jenis,
      stock: req.body.stock,
      gambar: req.file ? req.file.path : ''
    };

    newData.push(data);

    // Simpan data baru ke data.json
    fs.writeFile('data.json', JSON.stringify(newData, null, 2), (err) => {
      if (err) {
        console.log(err);
        return res.status(500).send('Error saving data');
      }
      res.redirect('/form.html'); 
    });
  });
});

app.get('/barang/data', (req, res) => {
  fs.readFile('data.json', (err, data) => {
    if (err) {
      res.status(500).send('Error reading data file');
      return;
    }
    res.json(JSON.parse(data));
  });
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
