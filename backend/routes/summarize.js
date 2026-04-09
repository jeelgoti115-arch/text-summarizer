const router = require('express').Router();
const multer = require('multer');
const pdfParse = require('pdf-parse');
const Summary = require('../models/Summary');

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('Only PDF files are allowed'), false);
    }
    cb(null, true);
  }
});

const STOPWORDS = new Set([
  'a','about','above','after','again','against','all','am','an','and','any','are','aren','as','at',
  'be','because','been','before','being','below','between','both','but','by',
  'could','couldn','did','didn','do','does','doesn','doing','don','down','during',
  'each','few','for','from','further','had','hadn','has','hasn','have','haven','having','he','her',
  'here','hers','herself','him','himself','his','how','i','if','in','into','is','isn','it','its','itself',
  'let','me','more','most','mustn','my','myself','no','nor','not','of','off','on','once','only','or','other','ought','our','ours','ourselves','out','over','own',
  'same','shan','she','should','shouldn','so','some','such','than','that','the','their','theirs','them','themselves','then','there','these','they','this','those','through','to','too',
  'under','until','up','very','was','wasn','we','were','weren','what','when','where','which','while','who','whom','why','with','won','would','wouldn','you','your','yours','yourself','yourselves'
]);

function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s']/g, ' ')
    .split(/\s+/)
    .filter(word => word && !STOPWORDS.has(word));
}

function sentenceSplit(text) {
  return text
    .replace(/\r\n|\r/g, '\n')
    .split(/(?<=[.!?])\s+/)
    .map(sentence => sentence.trim())
    .filter(Boolean);
}

function buildFrequencyMap(words) {
  const freq = {};
  words.forEach(word => {
    freq[word] = (freq[word] || 0) + 1;
  });
  return freq;
}

function scoreSentence(sentence, freqMap) {
  const words = tokenize(sentence);
  if (!words.length) return 0;
  const score = words.reduce((sum, word) => sum + (freqMap[word] || 0), 0);
  return score / words.length;
}

function generateSummary(text) {
  const normalized = text.trim();
  if (normalized.split(/\s+/).length <= 60) {
    return normalized;
  }

  const sentences = sentenceSplit(normalized);
  const words = tokenize(normalized);
  const freqMap = buildFrequencyMap(words);

  const scored = sentences.map(sentence => ({
    sentence,
    score: scoreSentence(sentence, freqMap)
  }));

  const topCount = Math.max(1, Math.min(3, Math.floor(sentences.length / 3)));
  const topSentences = scored
    .sort((a, b) => b.score - a.score)
    .slice(0, topCount)
    .sort((a, b) => sentences.indexOf(a.sentence) - sentences.indexOf(b.sentence))
    .map(item => item.sentence);

  return topSentences.join(' ');
}

async function extractTextFromPdf(buffer) {
  const data = await pdfParse(buffer);
  return data.text || '';
}

router.post('/', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ msg: 'Text is required' });
    }

    const summary = generateSummary(text);

    const newSummary = new Summary({
      originalText: text,
      summary
    });

    await newSummary.save();
    res.json({ summary });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Server error while generating summary' });
  }
});

router.post('/pdf', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: 'PDF file is required' });
    }

    const pdfText = await extractTextFromPdf(req.file.buffer);
    if (!pdfText.trim()) {
      return res.status(400).json({ msg: 'PDF contains no extractable text' });
    }

    const summary = generateSummary(pdfText);
    const newSummary = new Summary({
      originalText: pdfText,
      summary
    });

    await newSummary.save();
    res.json({ summary });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Server error while processing PDF' });
  }
});

module.exports = router;
