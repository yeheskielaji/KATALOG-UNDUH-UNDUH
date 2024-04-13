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
  destination: function(req, file, cb) {
    cb(null, './uploads');
  },
  filename: function(req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

app.post('/barang/simpan', upload.single('gambar'), (req, res) => {
  fs.readFile('data.json', (err, existingData) => {
    let newData = [];
    if (!err && existingData.length) {
      newData = JSON.parse(existingData);
    }

    let prefix = '';
    switch (req.body.jenis) {
      case 'makanan': prefix = 'M'; break;
      case 'hewan': prefix = 'H'; break;
      case 'tumbuhan': prefix = 'T'; break;
      case 'barang': prefix = 'B'; break;
      default: prefix = 'X';
    }

    const lastCode = newData.filter(item => item.kode.startsWith(prefix))
                            .reduce((max, item) => Math.max(max, parseInt(item.kode.substring(1))), 0);

    const newCode = prefix + String(lastCode + 1).padStart(3, '0');
    const data = {
      kode: newCode,
      nama: req.body.nama,
      hargaDasar: req.body.hargaDasar,
      jenis: req.body.jenis,
      stock: req.body.stock,
      gambar: req.file ? req.file.path.replace(/\\/g, "/") : 'uploads/default-image.png', 
      keterangan: req.body.keterangan || "" 
    };

    newData.push(data);
    fs.writeFile('data.json', JSON.stringify(newData, null, 2), (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({status: 'error', message: 'Error saving data'});
      }
      res.json({status: 'success', message: 'Data added successfully', data: newCode});
    });
  });
});


app.get('/barang/data', (req, res) => {
  fs.readFile('data.json', 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error reading data file');
    }
    res.json(JSON.parse(data || '[]'));
  });
});

app.get('/barang/data/:kode', (req, res) => {
  fs.readFile('data.json', 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error reading data file');
    }
    const items = JSON.parse(data || '[]');
    const item = items.find(item => item.kode === req.params.kode);
    if (item) {
      res.json(item);
    } else {
      res.status(404).send('Item not found');
    }
  });
});

app.put('/barang/update/:kode', (req, res) => {
  fs.readFile('data.json', 'utf8', (err, data) => {
      if (err) {
          console.error("Error reading data file:", err);
          return res.status(500).send('Error reading data file');
      }

      let items = JSON.parse(data);
      const index = items.findIndex(item => item.kode === req.params.kode);
      if (index === -1) {
          return res.status(404).send({ status: 'error', message: 'Item not found' });
      }

      // Update item
      items[index] = { ...items[index], ...req.body };

      fs.writeFile('data.json', JSON.stringify(items, null, 2), err => {
          if (err) {
              console.error("Error updating data:", err);
              return res.status(500).send({ status: 'error', message: 'Error updating data' });
          }
          res.send({ status: 'success', message: 'Item updated successfully' });
      });
  });
});

app.delete('/barang/hapus/:kode', (req, res) => {
  fs.readFile('data.json', 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error reading data file');
    }
    let items = JSON.parse(data || '[]');
    items = items.filter(item => item.kode !== req.params.kode);
    fs.writeFile('data.json', JSON.stringify(items, null, 2), err => {
      if (err) {
        console.error(err);
        return res.status(500).send('Error deleting data');
      }
      res.send({ status: 'success', message: 'Item deleted successfully' });
    });
  });
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
