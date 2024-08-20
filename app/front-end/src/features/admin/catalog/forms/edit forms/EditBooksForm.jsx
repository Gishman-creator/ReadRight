import React, { useState, useEffect } from 'react';
import ImagePreview from './ImagePreview';
import axiosUtils from '../../../../../utils/axiosUtils';
import { bufferToBlobURL, downloadImage } from '../../../../../utils/imageUtils';
import { useSelector } from 'react-redux';

function EditBooksForm({ onClose }) {
  const selectedRowBookId = useSelector((state) => state.catalog.selectedRowIds[0]);
  const serieBookId = useSelector((state) => state.catalog.bookId);
  const [bookId, setBookId] = useState(serieBookId || selectedRowBookId);
  const [bookDetails, setBookDetails] = useState({});
  const [bookImageURL, setBookImageURL] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [authorSearch, setAuthorSearch] = useState('');
  const [serieSearch, setSerieSearch] = useState('');
  const [authorOptions, setAuthorOptions] = useState([]);
  const [serieOptions, setSerieOptions] = useState([]);
  const [selectedAuthor, setSelectedAuthor] = useState('');
  const [selectedSerie, setSelectedSerie] = useState('');

  useEffect(() => {
    console.log('Book ID:', bookId); // Check if bookId is correct

    if (bookId) {
      const fetchBookDetails = async () => {
        try {
          const response = await axiosUtils(`/api/getBookById/${bookId}`, 'GET');
          setBookDetails(response.data);
          console.log('Book Details:', response.data);

          if (response.data.image && response.data.image.data) {
            const imageBlobURL = bufferToBlobURL(response.data.image);
            setBookImageURL(imageBlobURL);
          } else {
            setBookImageURL(response.data.imageURL || '');
          }

          setBookId(response.data.id);
          setSelectedAuthor(response.data.author_name || '');
          setAuthorSearch(response.data.author_name || '');
          setSelectedSerie(response.data.serie_name || '');
          setSerieSearch(response.data.serie_name || '');
        } catch (error) {
          console.error('Error fetching book details:', error);
        }
      };

      fetchBookDetails();
    }
  }, [bookId]);

  useEffect(() => {
    if (authorSearch) {
      const fetchAuthors = async () => {
        try {
          const response = await axiosUtils(`/api/searchAuthors?search=${authorSearch}`, 'GET');
          setAuthorOptions(response.data.map(author => ({
            id: author.id,
            name: author.name
          })));
          console.log(authorOptions);
        } catch (error) {
          console.error('Error fetching authors:', error);
        }
      };
      fetchAuthors();
    } else {
      setAuthorOptions([]);
    }
  }, [authorSearch]);

  useEffect(() => {
    if (serieSearch) {
      const fetchSeries = async () => {
        try {
          const response = await axiosUtils(`/api/searchSeries?search=${serieSearch}`, 'GET');
          setSerieOptions(response.data.map(serie => ({
            id: serie.id,
            name: serie.name
          })));
        } catch (error) {
          console.error('Error fetching series:', error);
        }
      };
      fetchSeries();
    } else {
      setSerieOptions([]);
    }
  }, [serieSearch]);

  const handleAuthorChange = (e) => {
    setAuthorSearch(e.target.value);
  };

  const handleSerieChange = (e) => {
    setSerieSearch(e.target.value);
  };

  const handleAuthorSelect = (author) => {
    setSelectedAuthor(author.name);
    setAuthorSearch(author.name);
    setAuthorOptions([]);
  };

  const handleSerieSelect = (serie) => {
    setSelectedSerie(serie.name);
    setSerieSearch(serie.name);
    setSerieOptions([]);
  };

  const handleImageChange = (url) => {
    setBookImageURL(url);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!bookId) {
      console.error('No book ID available for update');
      return;
    }

    const formData = new FormData(event.target);

    // Log form data entries
    for (let [key, value] of formData.entries()) {
      console.log(`${key}: ${value}`);
    }

    const bookName = formData.get('bookName') || '';

    if (bookImageURL) {
      const file = await downloadImage(bookImageURL, bookName);
      console.log('File:', file);
      if (file) {
        formData.append('bookImage', file);
      } else {
        console.error('Image file not available');
      }
    }

    formData.append('authorName', selectedAuthor);
    formData.append('serieName', selectedSerie);

    // Log form data entries
    for (let [key, value] of formData.entries()) {
      console.log(`${key}: ${value}`);
    }

    try {
      const response = await axiosUtils(`/api/updateBook/${bookId}`, 'PUT', formData, {
        'Content-Type': 'multipart/form-data',
      });

      if (response.status !== 200) throw new Error('Failed to update book');
      console.log('Book updated successfully');
      console.log(response);

      if (onClose) {
        onClose(); // Call the onClose function to close the modal
      }

      window.location.reload();

    } catch (error) {
      console.error('Error updating book:', error);
    }
  };

  return (
    <div className=''>
      <h2 className="text-lg font-semibold">Edit Book</h2>
      <form onSubmit={handleSubmit} className="flex flex-col md:flex-row max-h-custom2 md:max-h-fit overflow-y-auto md:overflow-hidden">
        <ImagePreview
          onImageChange={handleImageChange}
          imageURL={bookImageURL} // Pass existing image URL to the ImagePreview component
        />
        <div className="md:ml-4 md:px-4 md:max-w-[23rem] md:max-h-[15rem] md:overflow-y-auto">
          <div className="mb-4">
            <label className="block text-sm font-medium">Book name:</label>
            <input
              type="text"
              name="bookName"
              defaultValue={bookDetails.name || ''}
              className="w-full border border-gray-300 rounded px-2 py-1 focus:border-[#37643B] focus:ring-[#37643B]"
              required
            />
          </div>
          <div className="mb-4 relative">
            <label className="block text-sm font-medium">Author name:</label>
            <input
              type="text"
              value={authorSearch}
              onChange={handleAuthorChange}
              className="w-full border border-gray-300 rounded px-2 py-1"
              placeholder="Search author..."
            />
            {authorOptions.length > 0 && (
              <ul className="border border-gray-300 rounded max-h-60 overflow-auto bg-white absolute w-full top-14 z-10">
                {authorOptions.map((author) => (
                  <li
                    key={author.id}
                    onClick={() => handleAuthorSelect(author)}
                    className="cursor-pointer px-4 py-2 hover:bg-gray-100"
                  >
                    {author.name}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="mb-4 relative">
            <label className="block text-sm font-medium">Serie name:</label>
            <input
              type="text"
              value={serieSearch}
              onChange={handleSerieChange}
              className="w-full border border-gray-300 rounded px-2 py-1"
              placeholder="Search series..."
            />
            {serieOptions.length > 0 && (
              <ul className="border border-gray-300 rounded mt-2 max-h-60 overflow-auto bg-white absolute w-full top-12 z-10">
                {serieOptions.map((serie) => (
                  <li
                    key={serie.id}
                    onClick={() => handleSerieSelect(serie)}
                    className="cursor-pointer px-4 py-2 hover:bg-gray-100"
                  >
                    {serie.name}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="mb-2 flex space-x-2">
            <div>
              <label className="block text-sm font-medium">Author book position:</label>
              <input
                type="number"
                name="authorNo"
                defaultValue={bookDetails.authorNo || ''}
                className="w-full border border-gray-300 rounded px-2 py-1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Serie book position:</label>
              <input
                type="number"
                name="serieNo"
                defaultValue={bookDetails.serieNo || ''}
                className="w-full border border-gray-300 rounded px-2 py-1"
              />
            </div>
          </div>
          <div className="mb-2 flex space-x-2">
            <div>
              <label className="block text-sm font-medium">Publish date:</label>
              <input
                type="date"
                name="publishDate"
                defaultValue={bookDetails.date?.split('T')[0] || ''}
                className="w-full border border-gray-300 rounded px-2 py-1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Genres:</label>
              <input
                type="text"
                name="genres"
                defaultValue={bookDetails.genres || ''}
                className="w-full border border-gray-300 rounded px-2 py-1"
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium">Amazon link:</label>
            <input
              type="text"
              name="link"
              defaultValue={bookDetails.link || ''}
              className="w-full border border-gray-300 rounded px-2 py-1 focus:border-[#37643B] focus:ring-[#37643B]"
              required
            />
          </div>
          <button
            type="submit"
            className="bg-[#37643B] text-white px-4 py-2 rounded hover:bg-[#2a4c2c]"
          >
            Update Book
          </button>
        </div>
      </form>
    </div>
  );
}

export default EditBooksForm;