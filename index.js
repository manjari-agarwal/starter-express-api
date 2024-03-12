const express = require('express');
const axios = require('axios');
const fs = require('fs').promises; // For file operations
require('dotenv').config();
const app = express();
const { BlobServiceClient } = require('@azure/storage-blob');
const PORT = 3000;

// Middleware to parse JSON in request body
app.use(express.json());

// URL of the JSON file
const url = 'https://oneapphero1.blob.core.windows.net/businessdata/VAS.json';

// Function to fetch data from URL
const fetchDataFromURL = async () => {
    try {
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        console.error('Error fetching data from URL:', error);
        throw new Error('Error fetching data from URL');
    }
};

// Endpoint to retrieve data from URL
app.get('/getData', async (req, res) => {
    try {
        const data = await fetchDataFromURL();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching data from URL' });
    }
});

// Endpoint to retrieve data on search from URL
app.post('/getFilterData', async (req, res) => {
    const requestModel = req.body.model;
    const requestpriceList = req.body.priceList; // Extract the search query from the query
    try {
        const response = await fetchDataFromURL();
        const filteredData = response.filter(item =>
            item.model.toLowerCase().includes(requestModel.toLowerCase())
            && item.priceList.toLowerCase().includes(requestpriceList.toLowerCase()) // Assuming 'name' is the property you want to search
        );
        res.json(filteredData);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching data from URL' });
    }
});

// Endpoint to add new data to the JSON file
app.post('/addData', async (req, res) => {
    try {
        const newData = req.body;

        // Fetch existing data from URL
        const currentData = await fetchDataFromURL();

        // Add new data to existing data
        currentData.push(newData);

        // Write modified data back to file
        await fs.writeFile('data.json', JSON.stringify(currentData, null, 2), 'utf8');

        const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING);
        const containerClient = blobServiceClient.getContainerClient(process.env.AZURE_STORAGE_CONTAINER_NAME);
        const blockBlobClient = containerClient.getBlockBlobClient('VAS.json');
        const uploadBlobResponse = await blockBlobClient.uploadFile('data.json');
        res.json({ message: 'Data added successfully', newData });
    } catch (error) {
        console.error('Error adding data:', error);
        res.status(500).json({ error: 'Error adding data' });
    }
});

// Endpoint to add new data to the JSON file
app.post('/deleteData', async (req, res) => {
    try {
        const newData = req.body;

        // Fetch existing data from URL
        const currentData = await fetchDataFromURL();

        // filter data to be delete
        const filteredData = currentData.filter(item =>
            item.model.toLowerCase() !== newData.model.toLowerCase()
        );

        // Write modified data back to file
        await fs.writeFile('data.json', JSON.stringify(filteredData, null, 2), 'utf8');

        const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING);
        const containerClient = blobServiceClient.getContainerClient(process.env.AZURE_STORAGE_CONTAINER_NAME);
        const blockBlobClient = containerClient.getBlockBlobClient('VAS.json');
        const uploadBlobResponse = await blockBlobClient.uploadFile('data.json');
        res.json({ message: 'Data Deleted successfully', newData });
    } catch (error) {
        console.error('Error adding data:', error);
        res.status(500).json({ error: 'Error adding data' });
    }
});
// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
