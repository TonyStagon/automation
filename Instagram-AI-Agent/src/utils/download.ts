import axios from 'axios';
import * as fs from 'fs';
import logger from '../config/logger';

/**
 * Downloads a file from the given URL and saves it to the specified filename
 * 
 * @param url URL of the file to download
 * @param filename Path where the file should be saved
 * @param callback Function to call after download completes
 */
export async function download(url: string, filename: string, callback: () => void) {
  try {
    logger.info(`Downloading file from ${url} to ${filename}`);
    
    // Use axios to get the file as a stream
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'stream',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
        'Referer': 'https://www.google.com/',
        'Accept-Language': 'en-US,en;q=0.9'
      },
      maxRedirects: 5,
      timeout: 30000
    }).catch(async (error) => {
      if (error.response?.status === 403) {
        logger.warn(`403 Forbidden accessing ${url} - retrying with different headers`);
        // Retry with different headers
        return axios({
          url,
          method: 'GET',
          responseType: 'stream',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            'Accept': '*/*',
            'Referer': 'https://www.bing.com/'
          },
          maxRedirects: 5,
          timeout: 30000
        });
      }
      throw error;
    });
    
    // Create a write stream to save the file
    const writer = fs.createWriteStream(filename);
    
    // Pipe the response data to the file
    response.data.pipe(writer);
    
    // Return a Promise that resolves when the file is written
    writer.on('finish', () => {
      logger.info(`File downloaded successfully to ${filename}`);
      callback();
    });
    
    writer.on('error', (err) => {
      logger.error(`Error writing file to ${filename}:`, err);
      throw err;
    });
  } catch (error) {
    logger.error(`Error downloading file from ${url}:`, error);
    throw error;
  }
}