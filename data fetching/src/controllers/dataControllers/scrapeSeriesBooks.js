const axios = require('axios');
const cheerio = require('cheerio');
const poolpg = require('../../config/dbpg3');
const { generateRandomUserAgent } = require("../../utils/userAgentGenerator");
const { insertNewBook } = require('../../utils/scrapeSeriesBooks_utils/insertNewBook');

let isValidating = false;

const scrapeSeriesBooks = async (req, res) => {
    if (isValidating) {
        return;
    }
    isValidating = true;

    try {
        const client = await poolpg.connect();

        // Fetch series where book_status is null
        const { rows: seriesList } = await client.query(`
            SELECT s.id, s.serie_name, s.author_id, s.goodreads_link 
            FROM series s 
            JOIN authors a ON s.author_id::text = a.id::text
            WHERE s.book_status IS NULL;
        `);

        if (seriesList.length === 0) {
            console.log("No series to scrape.");
            if (req.io) req.io.emit('scrapeSeriesBooksMessage', "No series to scrape.");
            client.release();
            isValidating = false;
            return;
        }

        const userAgent = await generateRandomUserAgent();
        const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

        let processedSeries = 0;
        const totalSeries = seriesList.length;

        // Process each series in seriesList
        for (const serie of seriesList) {

            const { id: serieId, serie_name, author_id, goodreads_link } = serie;
            console.log("Processing serie:", serie_name, "from:", goodreads_link);

            const axiosConfig = { headers: { 'User-Agent': userAgent } };
            const response = await axios.get(goodreads_link, axiosConfig);
            // const response = await axios.get('https://www.goodreads.com/series/45175-harry-potter', axiosConfig);

            const $ = cheerio.load(response.data);

            const subtitleText = $('.responsiveSeriesHeader__subtitle').text();
            const numBooksMatch = subtitleText.match(/(\d+)\s+primary works/);
            const numBooks = numBooksMatch ? parseInt(numBooksMatch[1]) : 0;
            console.log("Number of primary works:", numBooks);

            const bookElements = $('.listWithDividers__item');
            console.log(`Number of divs with class 'listWithDividers__item':`, bookElements.length);

            let currentBookNum = 1; 
            // console.log("Processing books by:", serieId);
            
            for (const element of bookElements.toArray()) {
                if (currentBookNum > numBooks) break;
                // console.log("Current book number:", currentBookNum);

                const bookNumText = $(element).find('h3').text().trim();
                const bookNum = parseInt(bookNumText.replace('Book ', ''));
                // console.log("Book number:", bookNum);
                if (bookNum === currentBookNum || parseInt(numBooks) === parseInt(bookElements.length)) {

                    // Find book name
                    const bookName = $(element).find('a.gr-h3--serif span[itemprop="name"]').text().trim();
                    const bookGoodreads_link = `https://www.goodreads.com${$(element).find('a.gr-h3--serif').attr('href')}`;
                    // console.log("Processing book:", bookName);

                    // Prepare query-friendly book name
                    const safeBookName = bookName.replace(/'/g, "''").replace(/’/g, "''").replace(/ /g, '%'); 
                    // console.log("Safe book name:", safeBookName);

                    // Step 3: Database search
                    const findBookQuery = `
                        SELECT * FROM books
                        WHERE book_name ILIKE '%${safeBookName}%' AND author_id = $1;
                        `;
                    const result = await poolpg.query(findBookQuery, [author_id]);

                    if (result.rowCount > 0) {
                        // Book found: update serie_id_2
                        const bookId = result.rows[0].id;
                        const updateQuery = `
                            UPDATE books SET serie_id_2 = $1, serie_index = $2, goodreads_link = $3 WHERE id = $4
                            `;
                        await poolpg.query(updateQuery, [serieId, currentBookNum, bookGoodreads_link, bookId]);
                        console.log(`Updated book: ${bookName} index`, currentBookNum, `from ${bookGoodreads_link}`);
                    } else {
                        // Book not found: call insertNewBook
                        await insertNewBook(bookName, author_id, serieId, currentBookNum, bookGoodreads_link);
                        console.log(`Inserted new book: ${bookName} index`, currentBookNum, `from ${bookGoodreads_link}`);
                    }
                } else continue; 
                currentBookNum++;
            };

            console.log("Number of books:", numBooks);

            // await client.query(`UPDATE series SET book_status = 'done', goodreads_link = $1, num_books = $2 WHERE id = $3`, [goodreads_link, numBooks, serieId]);
            processedSeries++;
            const progressPercentage = ((processedSeries / totalSeries) * 100).toFixed(2);
            const progress = `${processedSeries}/${totalSeries} (${progressPercentage}%)`;
            console.log(`Progress: ${progress}\n`);
            if (req.io) req.io.emit('scrapeSeriesBooksMessage', `Progress: ${progress}`);
        }

        client.release();
        isValidating = false;

        if (req.io) req.io.emit('scrapeSeriesBooksMessage', "Series scraping completed.");

    } catch (error) {
        console.error("Error in scrapeSeriesBooks:", error);
        isValidating = false;
    }
};

module.exports = { scrapeSeriesBooks };
