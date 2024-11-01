const poolpg = require('../../config/dbpg3');

exports.insertNewBook = async (bookName, authorId, seriesId, serieIndex, bookGoodreadsLink) => {
    let bookIdLength = 6; // Start with 6 digits
    let maxIdsForCurrentLength;
    let currentLengthIdsCount;
    let idExists, bookId;

    do {
        maxIdsForCurrentLength = getMaxIdsForLength(bookIdLength);
        currentLengthIdsCount = await getIdsCountByLength(bookIdLength);

        if (currentLengthIdsCount < maxIdsForCurrentLength) {
            do {
                bookId = generateRandomId(bookIdLength);
                idExists = await checkIfIdExists(bookId);
            } while (idExists);
        } else {
            bookIdLength++;
        }
    } while (idExists || currentLengthIdsCount >= maxIdsForCurrentLength);

    const insertBookQuery = `INSERT INTO books (id, book_name, author_id, serie_id, serie_index, goodreads_link) VALUES ($1, $2, $3, $4, $5, $6)`;
    await poolpg.query(insertBookQuery, [bookId, bookName, authorId, seriesId, serieIndex, bookGoodreadsLink]); // Insert serie_id
};

// Helper function to calculate the maximum number of IDs for a given length
function getMaxIdsForLength(length) {
    return 9 * Math.pow(10, length - 1); // For length N, there are 9 * 10^(N-1) possible IDs (e.g., 6 digits = 900000)
}

// Helper function to generate a random ID of the given length
function generateRandomId(length) {
    return Math.floor(Math.pow(10, length - 1) + Math.random() * 9 * Math.pow(10, length - 1)).toString();
}

// Helper function to check if a given ID exists in the 'books' table
async function checkIfIdExists(bookId) {
    const result = await poolpg.query(`SELECT id FROM books WHERE id = $1`, [bookId]);
    return result.rows.length > 0;
}

// Helper function to count the number of IDs of a given length in the 'books' table
async function getIdsCountByLength(length) {
    const result = await poolpg.query(`SELECT COUNT(*) AS count FROM books WHERE LENGTH(id::text) = $1`, [length]);
    return parseInt(result.rows[0].count, 10);
}