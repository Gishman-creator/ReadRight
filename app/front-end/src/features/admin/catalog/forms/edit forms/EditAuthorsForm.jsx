import React, { useState, useEffect } from 'react';
import ImagePreview from './ImagePreview';
import axiosUtils from '../../../../../utils/axiosUtils';
import { bufferToBlobURL, downloadImage } from '../../../../../utils/imageUtils';
import { useSelector } from 'react-redux';

function EditAuthorForm({ onClose }) {
  const initialAuthorId = useSelector((state) => state.catalog.selectedRowIds[0]); // Assuming only one author is selected
  const [authorId, setAuthorId] = useState(initialAuthorId);
  const [authorData, setAuthorData] = useState({});
  const [authorImageURL, setAuthorImageURL] = useState('');
  const [imageFile, setImageFile] = useState(null);

  useEffect(() => {
    // Fetch author data when the component mounts
    const fetchAuthorData = async () => {
      try {
        const response = await axiosUtils(`/api/getAuthorById/${authorId}`, 'GET');
        console.log('Author data fetched:', response.data); // Log the entire response data

        setAuthorData(response.data);
        console.log('Author data:', response.data);

        if (response.data.image && response.data.image.data) {
          // Convert Buffer to Blob URL
          const imageBlobURL = bufferToBlobURL(response.data.image);
          setAuthorImageURL(imageBlobURL);
        } else {
          setAuthorImageURL(response.data.imageURL || ''); // Fallback if image data is not available
        }

        setAuthorId(response.data.id);
      } catch (error) {
        console.error('Error fetching author data:', error);
      }
    };

    fetchAuthorData();
  }, [authorId]);

  const handleImageChange = (url) => {
    setAuthorImageURL(url);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);

    // Extract last name from the full name
    const fullName = formData.get('authorName') || '';
    const nameParts = fullName.trim().split(' ');
    const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : nameParts[0];

    // Check if the URL has changed and a file should be appended
    if (authorImageURL !== authorData.imageURL) {
      const file = await downloadImage(authorImageURL, lastName);
      console.log('File:', file);
      if (file) {
        formData.append('authorImage', file); // Ensure this is appending correctly
      } else {
        console.error('Image file not available');
      }
    }

    // Log form data entries
    for (let [key, value] of formData.entries()) {
      console.log(`${key}: ${value}`);
    }

    try {
      const response = await axiosUtils(`/api/updateAuthor/${authorId}`, 'PUT', formData, {
        'Content-Type': 'multipart/form-data',
      });
      if (response.status !== 200) throw new Error('Failed to update author');
      console.log('Author updated successfully');
      if (onClose) onClose();

      window.location.reload();

    } catch (error) {
      console.error('Error updating author:', error.response ? error.response.data : error.message);
      if (onClose) onClose();
    }
  };

  return (
    <div className=''>
      <h2 className="text-lg font-semibold">Edit Author</h2>
      <form onSubmit={handleSubmit} className="flex flex-col md:flex-row max-h-custom2 md:max-h-fit overflow-y-auto md:overflow-hidden">
        <ImagePreview imageURL={authorImageURL} onImageChange={handleImageChange} />
        <div className="md:ml-4 md:px-4 md:max-w-[23rem] md:max-h-[15rem] md:overflow-y-auto">
          <div className="mb-2">
            <label className="block text-sm font-medium">Author name:</label>
            <input
              type="text"
              name="authorName"
              defaultValue={authorData.name || ''}
              className="w-full border border-gray-300 rounded px-2 py-1 focus:border-[#37643B] focus:ring-[#37643B]"
              required
            />
          </div>
          <div className="mb-2 flex space-x-2">
            <div>
              <label className="block text-sm font-medium">Number of series:</label>
              <input
                type="number"
                name="numSeries"
                defaultValue={authorData.seriesNo || ''}
                className="w-full border border-gray-300 rounded px-2 py-1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Number of books:</label>
              <input
                type="number"
                name="numBooks"
                defaultValue={authorData.bookNo || ''}
                className="w-full border border-gray-300 rounded px-2 py-1"
              />
            </div>
          </div>
          <div className="mb-2 flex space-x-2">
            <div>
              <label className="block text-sm font-medium">Date of birth:</label>
              <input
                type="date"
                name="dob"
                defaultValue={authorData.date?.split('T')[0] || ''}
                className="w-full border border-gray-300 rounded px-2 py-1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Nationality:</label>
              <input
                type="text"
                name="nationality"
                defaultValue={authorData.nationality || ''}
                className="w-full border border-gray-300 rounded px-2 py-1"
              />
            </div>
          </div>
          <div className="mb-2 flex space-x-2">
            <div>
              <label className="block text-sm font-medium">Biography:</label>
              <textarea
                name="biography"
                defaultValue={authorData.bio || ''}
                className="w-full border border-gray-300 rounded px-2 py-1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Awards:</label>
              <textarea
                name="awards"
                defaultValue={authorData.awards || ''}
                className="w-full border border-gray-300 rounded px-2 py-1"
              />
            </div>
          </div>
          <div className="mb-2 flex space-x-2">
            <div>
              <label className="block text-sm font-medium">X:</label>
              <input
                type="text"
                name="x"
                defaultValue={authorData.x || ''}
                className="w-full border border-gray-300 rounded px-2 py-1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Instagram:</label>
              <input
                type="text"
                name="instagram"
                defaultValue={authorData.ig || ''}
                className="w-full border border-gray-300 rounded px-2 py-1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Facebook:</label>
              <input
                type="text"
                name="facebook"
                defaultValue={authorData.fb || ''}
                className="w-full border border-gray-300 rounded px-2 py-1"
              />
            </div>
          </div>
          <div className="mb-4 flex space-x-2">
            <div>
              <label className="block text-sm font-medium">Website:</label>
              <input
                type="text"
                name="website"
                defaultValue={authorData.link || ''}
                className="w-full border border-gray-300 rounded px-2 py-1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Genres:</label>
              <input
                type="text"
                name="genres"
                defaultValue={authorData.genres || ''}
                className="w-full border border-gray-300 rounded px-2 py-1"
              />
            </div>
          </div>
          <button
            type="submit"
            className="bg-[#37643B] text-white px-4 py-2 rounded hover:bg-[#2a4c2c]"
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}

export default EditAuthorForm;