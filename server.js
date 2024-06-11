const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userRoutes = require('./routes/userRoutes');
const pdfRoutes = require('./routes/pdfRoutes');


dotenv.config();

const app = express();
const Db = process.env.Db;


// enable Cors for all routes
app.use(cors());
app.use(bodyParser.json());

// Connect to MongoDBs
mongoose.connect(Db)
.then(() => console.log('MongoDB connected'))
.catch(err => console.log(err));


// Define a schema and model for resume
const resumeSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  education: String,
  experience: String,
  skills: String,
});

const Resume = mongoose.model('Resume', resumeSchema);


// Signup route
app.post('/signup', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ email, password: hashedPassword });
    const savedUser = await newUser.save();

    res.status(201).json({ message: 'User created successfully', user: savedUser });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Login route
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user._id, email: user.email }, 'your_jwt_secret', { expiresIn: '1h' });

    res.status(200).json({ message: 'Login successful', token });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Middleware to authenticate token
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) {
    return res.status(401).json({ message: 'Access denied' });
  }

  try {
    const verified = jwt.verify(token, 'your_jwt_secret');
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ message: 'Invalid token' });
  }
};

// Resume submission route
app.post('/submit', authenticateToken, async (req, res) => {
  const resumeDetails = req.body;
  
  const newResume = new Resume(resumeDetails);
  
  try {
    const savedResume = await newResume.save();
    res.status(201).json(savedResume);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});


// Routes

app.get('/', (req, res) => {
  res.send('Resume API');
});

app.use(express.static(path.join(__dirname, 'front.end/build')));

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'front.end/build', 'index.html'));
});

app.use('/api/users', userRoutes);

app.get('/api/resumes', async (req, res) => {
  const resumes = await Resume.find();
  res.json(resumes);
});


app.put('/api/resumes/:id', async (req, res) => {
  const updatedResume = await Resume.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(updatedResume);
});

app.delete('/api/resumes/:id', async (req, res) => {
  await Resume.findByIdAndDelete(req.params.id);
  res.json({ message: 'Resume deleted' });
});

// Generate PDF route
app.post('/generate-pdf', authenticateToken, async (req, res) => {
  const resumeDetails = req.body;

  try {
    const doc = new PDFDocument();
    let buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      let pdfData = Buffer.concat(buffers);
      res.writeHead(200, {
        'Content-Length': Buffer.byteLength(pdfData),
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment;filename=resume.pdf',
      }).end(pdfData);
    });

    // PDF content
    doc.fontSize(20).text(`Resume: ${resumeDetails.name}`, { align: 'center' });
    doc.fontSize(14).text(`Email: ${resumeDetails.email}`);
    doc.fontSize(14).text(`Phone: ${resumeDetails.phone}`);
    doc.fontSize(14).text(`Address: ${resumeDetails.address}`);

    doc.moveDown();
    doc.fontSize(16).text('Education');
    resumeDetails.education.forEach((edu) => {
      doc.fontSize(14).text(`Institution: ${edu.institution}`);
      doc.fontSize(14).text(`Degree: ${edu.degree}`);
      doc.fontSize(14).text(`Start Date: ${edu.startDate}`);
      doc.fontSize(14).text(`End Date: ${edu.endDate}`);
      doc.moveDown();
    });

    doc.fontSize(16).text('Experience');
    resumeDetails.experience.forEach((exp) => {
      doc.fontSize(14).text(`Company: ${exp.company}`);
      doc.fontSize(14).text(`Role: ${exp.role}`);
      doc.fontSize(14).text(`Start Date: ${exp.startDate}`);
      doc.fontSize(14).text(`End Date: ${exp.endDate}`);
      doc.fontSize(14).text(`Description: ${exp.description}`);
      doc.moveDown();
    });

    doc.fontSize(16).text('Skills');
    resumeDetails.skills.forEach((skill) => {
      doc.fontSize(14).text(skill);
    });

    doc.moveDown();
    doc.fontSize(16).text('Projects');
    resumeDetails.projects.forEach((project) => {
      doc.fontSize(14).text(`Title: ${project.title}`);
      doc.fontSize(14).text(`Description: ${project.description}`);
      doc.fontSize(14).text(`Link: ${project.link}`);
      doc.moveDown();
    });

    doc.end();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// Start the server
app.listen(5000, () => {
  console.log('Server is running on port 5000');
});
