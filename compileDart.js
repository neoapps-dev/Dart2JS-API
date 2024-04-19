const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

module.exports = async (req, res) => {
    if (req.method === 'POST') {
        const { pid, uri } = req.body;

        if (!pid || !uri) {
            return res.status(400).json({ error: 'Missing parameters' });
        }

        try {
            // Download Dart file from URL
            const response = await axios.get(uri);
            const tempDartFilePath = path.join('/tmp', 'temp.dart');
            fs.writeFileSync(tempDartFilePath, response.data);

            // Command to execute dart2js
            const command = `dart2js ${tempDartFilePath} -o ${pid}.js`;

            // Execute dart2js as a child process
            const { stderr } = await exec(command);

            if (stderr) {
                return res.status(500).json({ error: 'Compilation failed' });
            }

            // Read compiled JavaScript file
            const compiledFilePath = path.join('/tmp', `${pid}.js`);
            const compiledContent = fs.readFileSync(compiledFilePath);

            // Delete temporary and compiled files
            fs.unlinkSync(tempDartFilePath);
            fs.unlinkSync(compiledFilePath);

            // Send compiled JavaScript file as response
            res.setHeader('Content-Type', 'application/javascript');
            res.status(200).send(compiledContent);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Server error' });
        }
    } else {
        res.status(405).json({ error: 'Method Not Allowed' });
    }
};
