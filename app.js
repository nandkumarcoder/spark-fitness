/* ==========================================
   SPARK FITNESS - WEB APP LOGIC
   ========================================== */

// Firebase Configuration - Replace with your own config keys from Firebase console
// Once configured, this website will automatically sync uploads globally for everyone!
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

let useFirebase = false;
let dbFirestore = null;
let storage = null;
let auth = null;

// Initialize Firebase if user config is set
if (typeof firebase !== 'undefined' && firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_API_KEY") {
    try {
        firebase.initializeApp(firebaseConfig);
        dbFirestore = firebase.firestore();
        storage = firebase.storage();
        auth = firebase.auth();
        useFirebase = true;
    } catch (e) {
        console.error("Error initializing Firebase:", e);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initMobileMenu();
    initStatCounters();
    initQuotes();
    
    // Initialize Gallery: Firebase Realtime mode or Local DB fallback mode
    if (useFirebase) {
        auth.signInAnonymously().then(() => {
            initGallery();
        }).catch(err => {
            console.error("Firebase auth error, running in local database fallback mode:", err);
            useFirebase = false; // fallback
            initLocalGallery();
        });
    } else {
        initLocalGallery();
    }

    initWhatsAppInquiry();
    initScrollSpy();
});

function initLocalGallery() {
    initDB().then(() => {
        initGallery();
    }).catch(err => {
        console.error("IndexedDB initialisation failed, gallery will load static items only:", err);
        initGallery(); // Fallback without persistence
    });
}

/* ==========================================
   INDEXEDDB MEDIA PERSISTENCE HELPER (LOCAL MODE)
   ========================================== */
const LOCAL_DB_NAME = 'SparkFitnessDB';
const LOCAL_DB_VERSION = 1;
const LOCAL_STORE_NAME = 'uploads';
let localDb = null;

function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(LOCAL_DB_NAME, LOCAL_DB_VERSION);
        
        request.onerror = (e) => {
            console.error("Local database open error:", e.target.error);
            reject(e.target.error);
        };
        
        request.onsuccess = (e) => {
            localDb = e.target.result;
            resolve();
        };
        
        request.onupgradeneeded = (e) => {
            const dbInstance = e.target.result;
            if (!dbInstance.objectStoreNames.contains(LOCAL_STORE_NAME)) {
                dbInstance.createObjectStore(LOCAL_STORE_NAME, { keyPath: 'id' });
            }
        };
    });
}

function saveUpload(item) {
    return new Promise((resolve, reject) => {
        if (!localDb) return reject(new Error("Local database not initialized"));
        const transaction = localDb.transaction([LOCAL_STORE_NAME], 'readwrite');
        const store = transaction.objectStore(LOCAL_STORE_NAME);
        const request = store.add(item);
        
        request.onsuccess = () => resolve();
        request.onerror = (e) => reject(e.target.error);
    });
}

function getAllUploads() {
    return new Promise((resolve, reject) => {
        if (!localDb) return resolve([]);
        const transaction = localDb.transaction([LOCAL_STORE_NAME], 'readonly');
        const store = transaction.objectStore(LOCAL_STORE_NAME);
        const request = store.getAll();
        
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = (e) => reject(e.target.error);
    });
}

function deleteUpload(id) {
    return new Promise((resolve, reject) => {
        if (!localDb) return reject(new Error("Local database not initialized"));
        const transaction = localDb.transaction([LOCAL_STORE_NAME], 'readwrite');
        const store = transaction.objectStore(LOCAL_STORE_NAME);
        const request = store.delete(id);
        
        request.onsuccess = () => resolve();
        request.onerror = (e) => reject(e.target.error);
    });
}

/* ==========================================
   1. MOBILE MENU TOGGLE
   ========================================== */
function initMobileMenu() {
    const mobileToggle = document.getElementById('mobile-toggle');
    const navMenu = document.getElementById('nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    if (mobileToggle && navMenu) {
        mobileToggle.addEventListener('click', () => {
            mobileToggle.classList.toggle('active');
            navMenu.classList.toggle('active');
        });

        // Close menu when clicking on a link
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                mobileToggle.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });
    }
}

/* ==========================================
   2. STAT COUNTERS ANIMATION
   ========================================== */
function initStatCounters() {
    const statNumbers = document.querySelectorAll('.stat-number');
    
    const countUp = (element) => {
        const target = parseInt(element.getAttribute('data-target'), 10);
        let current = 0;
        const duration = 2000; // 2 seconds
        const stepTime = Math.max(Math.floor(duration / target), 15);
        
        const timer = setInterval(() => {
            current += Math.ceil(target / (duration / stepTime));
            if (current >= target) {
                element.textContent = target;
                clearInterval(timer);
            } else {
                element.textContent = current;
            }
        }, stepTime);
    };

    // Trigger animation when section is visible
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                countUp(entry.target);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    statNumbers.forEach(num => observer.observe(num));
}

/* ==========================================
   3. DAILY QUOTE ENGINE
   ========================================== */
const FITNESS_QUOTES = [
    { text: "The only bad workout is the one that didn't happen.", author: "Unknown" },
    { text: "What hurts today makes you stronger tomorrow.", author: "Jay Cutler" },
    { text: "Success starts with self-discipline.", author: "Dwayne Johnson" },
    { text: "Your body can stand almost anything. It's your mind that you have to convince.", author: "Unknown" },
    { text: "Gold medals aren't really made of gold. They're made of sweat, determination, and a hard-to-find alloy called guts.", author: "Dan Gable" },
    { text: "The clock is ticking. Are you becoming the person you want to be?", author: "Greg Plitt" },
    { text: "You don't have to be extreme, just consistent.", author: "Unknown" },
    { text: "No pain, no gain. Shut up and train.", author: "Arnold Schwarzenegger" },
    { text: "Energy and persistence conquer all things.", author: "Benjamin Franklin" },
    { text: "Action is the foundational key to all success.", author: "Pablo Picasso" },
    { text: "When you feel like quitting, think about why you started.", author: "Unknown" },
    { text: "Excuses don't burn calories.", author: "Unknown" },
    { text: "The body achieves what the mind believes.", author: "Unknown" },
    { text: "Strength does not come from winning. Your struggles develop your strengths.", author: "Arnold Schwarzenegger" },
    { text: "You miss 100% of the shots you don't take.", author: "Wayne Gretzky" },
    { text: "Look in the mirror. That's your competition.", author: "John Assaraf" },
    { text: "Doubt kills more dreams than failure ever will.", author: "Suzy Kassem" },
    { text: "A champion is someone who gets up when they can't.", author: "Jack Dempsey" },
    { text: "If it doesn't challenge you, it doesn't change you.", author: "Fred DeVito" },
    { text: "You are one workout away from a good mood.", author: "Unknown" }
];

function initQuotes() {
    const quoteText = document.getElementById('quote-text');
    const quoteAuthor = document.getElementById('quote-author');
    const btnNewQuote = document.getElementById('btn-new-quote');

    if (!quoteText || !quoteAuthor) return;

    // Load Daily Quote based on day of the month
    const today = new Date();
    const dayIndex = today.getDate() % FITNESS_QUOTES.length;
    displayQuote(FITNESS_QUOTES[dayIndex]);

    // Manual quote generator
    if (btnNewQuote) {
        btnNewQuote.addEventListener('click', () => {
            // Apply fade transition
            quoteText.parentElement.style.opacity = 0;
            setTimeout(() => {
                const randIndex = Math.floor(Math.random() * FITNESS_QUOTES.length);
                displayQuote(FITNESS_QUOTES[randIndex]);
                quoteText.parentElement.style.opacity = 1;
            }, 300);
        });
    }

    function displayQuote(quoteObj) {
        quoteText.textContent = `"${quoteObj.text}"`;
        quoteAuthor.textContent = `— ${quoteObj.author}`;
    }
}

/* ==========================================
   4. INTERACTIVE GALLERY & MEDIA UPLOADS
   ========================================== */
function initGallery() {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const galleryGrid = document.getElementById('gallery-grid');
    
    // Lightbox elements
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxVideo = document.getElementById('lightbox-video');
    const lightboxCaption = document.getElementById('lightbox-caption');
    const lightboxClose = document.getElementById('lightbox-close');
    const lightboxPrev = document.getElementById('lightbox-prev');
    const lightboxNext = document.getElementById('lightbox-next');
    
    let currentLightboxIndex = -1;
    let allGalleryItems = [];
    
    // Track local object URLs to revoke on delete (Local DB fallback mode)
    const objectUrlMap = new Map();

    // 4.1 Load Uploaded Media (Firebase Realtime or Local Fallback)
    if (useFirebase) {
        // Real-time synchronization
        dbFirestore.collection('gallery')
            .orderBy('timestamp', 'desc')
            .onSnapshot(snapshot => {
                // Remove all previous custom upload cards to prevent duplication on snapshot update
                document.querySelectorAll('.gallery-item-upload').forEach(el => el.remove());
                
                snapshot.forEach(doc => {
                    const item = doc.data();
                    renderUploadedMedia(doc.id, item.type, item.url, item.title);
                });
                updateGalleryItemsList();
            }, err => {
                console.error("Firestore loading error:", err);
            });
    } else {
        // Local mode fallback
        getAllUploads().then(items => {
            items.forEach(item => {
                const objectUrl = URL.createObjectURL(item.data);
                objectUrlMap.set(item.id, objectUrl);
                renderUploadedMedia(item.id, item.type, objectUrl, item.title);
            });
            updateGalleryItemsList();
        }).catch(err => {
            console.error("Error retrieving media from IndexedDB:", err);
        });
    }

    // 4.2 Drag and Drop Handlers
    if (dropZone && fileInput) {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, preventDefaults, false);
        });

        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }

        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => dropZone.classList.add('dragover'), false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => dropZone.classList.remove('dragover'), false);
        });

        dropZone.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            const files = dt.files;
            handleFiles(files);
        });

        fileInput.addEventListener('change', (e) => {
            handleFiles(e.target.files);
        });
    }

    function handleFiles(files) {
        if (files.length === 0) return;
        const file = files[0];
        const isImage = file.type.startsWith('image/');
        const isVideo = file.type.startsWith('video/');

        if (!isImage && !isVideo) {
            alert('Unsupported format. Please upload an image or a video file.');
            return;
        }

        // Limit size to 15MB for responsive database storage
        if (file.size > 15 * 1024 * 1024) {
            alert('File size exceeds the 15MB limit.');
            return;
        }

        const title = file.name.substring(0, file.name.lastIndexOf('.')) || 'Gym Media';
        
        // Show status feedback
        const dropTextEl = dropZone.querySelector('.drop-text');
        const originalText = dropTextEl.textContent;
        setUploadStatus("Uploading... Please wait.");

        if (isImage) {
            // Process Image resizing via Canvas before saving
            const reader = new FileReader();
            reader.onload = (event) => {
                resizeImage(event.target.result, 900, (resizedBlob) => {
                    const uniqueId = 'img_' + Date.now();
                    
                    if (useFirebase) {
                        uploadToFirebase(uniqueId, 'image', resizedBlob, title)
                            .then(() => setUploadStatus("Upload Successful!", true))
                            .catch(err => {
                                alert("Firebase upload failed: " + err.message);
                                setUploadStatus(originalText);
                            });
                    } else {
                        const uploadItem = { id: uniqueId, type: 'image', data: resizedBlob, title: title };
                        saveUpload(uploadItem).then(() => {
                            const objectUrl = URL.createObjectURL(resizedBlob);
                            objectUrlMap.set(uniqueId, objectUrl);
                            renderUploadedMedia(uniqueId, 'image', objectUrl, title);
                            updateGalleryItemsList();
                            setUploadStatus("Saved locally!", true);
                        }).catch(err => {
                            alert('Error saving image locally: ' + err.message);
                            setUploadStatus(originalText);
                        });
                    }
                });
            };
            reader.readAsDataURL(file);
        } else if (isVideo) {
            const uniqueId = 'vid_' + Date.now();
            
            if (useFirebase) {
                uploadToFirebase(uniqueId, 'video', file, title)
                    .then(() => setUploadStatus("Upload Successful!", true))
                    .catch(err => {
                        alert("Firebase upload failed: " + err.message);
                        setUploadStatus(originalText);
                    });
            } else {
                const uploadItem = { id: uniqueId, type: 'video', data: file, title: title };
                saveUpload(uploadItem).then(() => {
                    const objectUrl = URL.createObjectURL(file);
                    objectUrlMap.set(uniqueId, objectUrl);
                    renderUploadedMedia(uniqueId, 'video', objectUrl, title);
                    updateGalleryItemsList();
                    setUploadStatus("Saved locally!", true);
                }).catch(err => {
                    alert('Error saving video locally: ' + err.message);
                    setUploadStatus(originalText);
                });
            }
        }

        function setUploadStatus(text, success = false) {
            if (dropTextEl) {
                dropTextEl.textContent = text;
                if (success) {
                    setTimeout(() => {
                        dropTextEl.textContent = "Drag & Drop Gym Photos Here or";
                    }, 3000);
                }
            }
        }
    }

    // Upload files directly to Firebase Cloud Storage and link it in Firestore
    function uploadToFirebase(id, type, blob, title) {
        const fileRef = storage.ref().child(`gallery/${id}`);
        return fileRef.put(blob).then(snapshot => {
            return snapshot.ref.getDownloadURL();
        }).then(downloadURL => {
            return dbFirestore.collection('gallery').doc(id).set({
                type: type,
                title: title,
                url: downloadURL,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
        });
    }

    // Process image resizing using HTML5 Canvas to keep databases light
    function resizeImage(dataUrl, maxSide, callback) {
        const img = new Image();
        img.src = dataUrl;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > maxSide) {
                    height = Math.round((height * maxSide) / width);
                    width = maxSide;
                }
            } else {
                if (height > maxSide) {
                    width = Math.round((width * maxSide) / height);
                    height = maxSide;
                }
            }

            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob((blob) => {
                callback(blob);
            }, 'image/jpeg', 0.8);
        };
    }

    // Render uploaded media (Image or Video) in gallery grid
    function renderUploadedMedia(id, type, mediaUrl, title) {
        const item = document.createElement('div');
        item.classList.add('gallery-item', 'gallery-item-upload');
        item.setAttribute('data-id', id);
        item.setAttribute('data-type', type);
        item.setAttribute('data-src', mediaUrl);
        item.setAttribute('data-title', title);
        
        let mediaHtml = '';
        if (type === 'video') {
            mediaHtml = `
                <span class="badge-user-upload">${useFirebase ? 'Gym Video' : 'User Video'}</span>
                <button class="delete-btn" aria-label="Delete video" data-id="${id}">
                    <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M19 4h-3.5l-1-1h-5l-1 1H5v2h14M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12Z"/></svg>
                </button>
                <div class="gallery-item-video-overlay">
                    <svg viewBox="0 0 24 24"><path fill="currentColor" d="M8 5v14l11-7z"/></svg>
                </div>
                <video src="${mediaUrl}" muted loop playsinline></video>
                <div class="gallery-item-overlay">
                    <span class="item-category">Member Spark</span>
                    <h4 class="item-title">${title}</h4>
                </div>
            `;
        } else {
            mediaHtml = `
                <span class="badge-user-upload">${useFirebase ? 'Gym Photo' : 'User Photo'}</span>
                <button class="delete-btn" aria-label="Delete photo" data-id="${id}">
                    <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M19 4h-3.5l-1-1h-5l-1 1H5v2h14M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12Z"/></svg>
                </button>
                <img src="${mediaUrl}" alt="${title}" loading="lazy">
                <div class="gallery-item-overlay">
                    <span class="item-category">Member Spark</span>
                    <h4 class="item-title">${title}</h4>
                </div>
            `;
        }
        
        item.innerHTML = mediaHtml;
        
        // Append to top of grid
        galleryGrid.insertBefore(item, galleryGrid.firstChild);

        // Delete button listener
        item.querySelector('.delete-btn').addEventListener('click', (e) => {
            e.stopPropagation(); // Avoid opening lightbox
            deleteMedia(id);
        });

        // Play-on-hover interaction for video elements
        if (type === 'video') {
            const videoEl = item.querySelector('video');
            item.addEventListener('mouseenter', () => {
                videoEl.play().catch(() => {});
            });
            item.addEventListener('mouseleave', () => {
                videoEl.pause();
                videoEl.currentTime = 0;
            });
        }

        // Lightbox click trigger
        item.addEventListener('click', () => {
            openLightbox(item);
        });
    }

    function deleteMedia(id) {
        if (!confirm('Are you sure you want to delete this media item?')) return;
        
        if (useFirebase) {
            // Delete from Firestore & Storage
            dbFirestore.collection('gallery').doc(id).delete()
                .then(() => {
                    return storage.ref().child(`gallery/${id}`).delete();
                })
                .catch(err => {
                    console.error("Firebase deletion failed:", err);
                    alert("Delete failed: " + err.message);
                });
        } else {
            // Local fallback deletion
            deleteUpload(id).then(() => {
                const url = objectUrlMap.get(id);
                if (url) {
                    URL.revokeObjectURL(url);
                    objectUrlMap.delete(id);
                }
                const card = document.querySelector(`[data-id="${id}"]`);
                if (card) card.remove();
                
                updateGalleryItemsList();
            }).catch(err => {
                alert("Delete failed: " + err.message);
            });
        }
    }

    // Lightbox Controls
    function updateGalleryItemsList() {
        allGalleryItems = Array.from(document.querySelectorAll('.gallery-item'));
    }

    const staticItems = document.querySelectorAll('.gallery-item:not(.gallery-item-upload)');
    staticItems.forEach(item => {
        item.addEventListener('click', () => {
            openLightbox(item);
        });
    });

    function openLightbox(item) {
        updateGalleryItemsList();
        currentLightboxIndex = allGalleryItems.indexOf(item);
        
        const src = item.getAttribute('data-src');
        const title = item.getAttribute('data-title');
        const type = item.getAttribute('data-type') || 'image';
        
        if (type === 'video') {
            lightboxImg.style.display = 'none';
            lightboxVideo.style.display = 'block';
            lightboxVideo.src = src;
            lightboxVideo.play().catch(() => {});
        } else {
            lightboxVideo.pause();
            lightboxVideo.src = '';
            lightboxVideo.style.display = 'none';
            
            lightboxImg.style.display = 'block';
            lightboxImg.src = src;
        }
        
        lightboxCaption.textContent = title;
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden'; // Stop background scrolling
    }

    function closeLightbox() {
        lightbox.classList.remove('active');
        lightboxVideo.pause();
        lightboxVideo.src = '';
        lightboxImg.src = '';
        document.body.style.overflow = ''; // Resume scrolling
    }

    function prevMedia() {
        if (allGalleryItems.length === 0 || currentLightboxIndex === -1) return;
        currentLightboxIndex = (currentLightboxIndex - 1 + allGalleryItems.length) % allGalleryItems.length;
        openLightbox(allGalleryItems[currentLightboxIndex]);
    }

    function nextMedia() {
        if (allGalleryItems.length === 0 || currentLightboxIndex === -1) return;
        currentLightboxIndex = (currentLightboxIndex + 1) % allGalleryItems.length;
        openLightbox(allGalleryItems[currentLightboxIndex]);
    }

    if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
    if (lightboxPrev) lightboxPrev.addEventListener('click', prevMedia);
    if (lightboxNext) lightboxNext.addEventListener('click', nextMedia);
    
    if (lightbox) {
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox || e.target.classList.contains('lightbox-content')) {
                closeLightbox();
            }
        });
    }

    document.addEventListener('keydown', (e) => {
        if (!lightbox.classList.contains('active')) return;
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') prevMedia();
        if (e.key === 'ArrowRight') nextMedia();
    });
}

/* ==========================================
   5. WHATSAPP INQUIRY REDIRECTION
   ========================================== */
function initWhatsAppInquiry() {
    const form = document.getElementById('whatsapp-form');
    const programSelect = document.getElementById('form-program');
    
    const inquiryButtons = document.querySelectorAll('.open-inquiry');
    inquiryButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const programName = btn.getAttribute('data-program');
            if (programSelect) {
                programSelect.value = programName;
                
                const contactSection = document.getElementById('contact');
                if (contactSection) {
                    contactSection.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    });

    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const name = document.getElementById('form-name').value.trim();
            const program = programSelect.value;
            const userMsg = document.getElementById('form-message').value.trim();
            
            const phoneNum = '918960479446'; // Gym number: +91 089604 79446
            
            let waMessage = `Hi Spark Fitness! I'm interested in joining the gym. Here are my details:\n\n`;
            waMessage += `*Name:* ${name}\n`;
            waMessage += `*Inquiry:* ${program}\n`;
            if (userMsg) {
                waMessage += `*Message:* ${userMsg}\n`;
            }
            waMessage += `\nSent via Spark Fitness web portal.`;
            
            const encodedText = encodeURIComponent(waMessage);
            const waUrl = `https://wa.me/${phoneNum}?text=${encodedText}`;
            
            window.open(waUrl, '_blank');
        });
    }
}

/* ==========================================
   6. SCROLL SPY & HEADER ACTIVE LINKS
   ========================================== */
function initScrollSpy() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');
    const header = document.getElementById('main-header');

    window.addEventListener('scroll', () => {
        const scrollY = window.pageYOffset;

        if (header) {
            if (scrollY > 50) {
                header.style.padding = '10px 0';
                header.style.backgroundColor = 'rgba(9, 9, 11, 0.9)';
            } else {
                header.style.padding = '0';
                header.style.backgroundColor = 'rgba(9, 9, 11, 0.75)';
            }
        }

        sections.forEach(current => {
            const sectionHeight = current.offsetHeight;
            const sectionTop = current.offsetTop - 120;
            const sectionId = current.getAttribute('id');

            if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${sectionId}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    });
}
