// ========================================
// Firebase Storage - Image Upload
// ========================================

import {
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js';

// Upload image to Firebase Storage
export async function uploadImage(file) {
    try {
        // Create a unique filename
        const timestamp = Date.now();
        const filename = `exams/${timestamp}_${file.name}`;
        const storageRef = ref(window.storage, filename);

        // Upload the file
        await uploadBytes(storageRef, file);

        // Get the download URL
        const downloadURL = await getDownloadURL(storageRef);

        return {
            success: true,
            url: downloadURL,
            path: filename
        };
    } catch (error) {
        console.error('Error uploading image:', error);
        return {
            success: false,
            error: 'حدث خطأ في رفع الصورة'
        };
    }
}

// Delete image from Firebase Storage
export async function deleteImage(imagePath) {
    try {
        const imageRef = ref(window.storage, imagePath);
        await deleteObject(imageRef);
        return { success: true };
    } catch (error) {
        console.error('Error deleting image:', error);
        return {
            success: false,
            error: 'حدث خطأ في حذف الصورة'
        };
    }
}

// Export for global access
window.firebaseStorage = {
    uploadImage,
    deleteImage
};
