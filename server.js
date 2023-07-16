const express = require('express');
const turf = require('@turf/turf');

const app = express();
const port = 3000;

app.use(express.json());

// Define the lines
const lines = [
  {
    id: 'L01',
    start: [-74.0386542, 40.7302174],
    end: [-74.038756, 40.7295611]
  },
  // Add the remaining lines here...
];

// Define the secret token
const secretToken = 'd13dda5a-779d-49c3-9679-0c1763378a68';

// Middleware for header-based auth check
app.use((req, res, next) => {
  const authHeader = req.headers.authorization;

  // Check if auth header is missing or malformed
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Extract token from auth header
  const token = authHeader.split(' ')[1];

  // Perform auth validation
  if (token !== secretToken) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Proceed to the next middleware if auth is successful
  next();
});

// POST route to find intersections
app.post('/findIntersections', (req, res) => {
  try {
    // Check the validity of the request body
    const { line } = req.body;
    if (!line || line.type !== 'LineString' || !line.coordinates || !Array.isArray(line.coordinates)) {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    // Convert the linestring to a turf.js feature
    const linestringFeature = turf.lineString(line.coordinates);

    // Find intersections with each line
    const intersections = lines.reduce((acc, line) => {
      const lineFeature = turf.lineString([line.start, line.end]);
      const intersect = turf.lineIntersect(linestringFeature, lineFeature);
      if (intersect.features.length > 0) {
        const intersectionPoint = intersect.features[0].geometry.coordinates;
        acc.push({ id: line.id, intersection: intersectionPoint });
      }
      return acc;
    }, []);

    // Return the intersections if any
    return res.json(intersections);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
