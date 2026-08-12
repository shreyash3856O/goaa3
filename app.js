/* ==========================================================================
   HH GOA 2026 — Editorial Shoreline Engine (v3)
   Calm, photographic travel-editorial canvas engine featuring warm soft-serif
   typography ('Fraunces'), muted natural palettes, brass accents, HEIC conversion,
   live webcam selfie stream, and direct X share flow.
   ========================================================================== */

(function () {
  'use strict';

  // DOM Elements
  const canvas = document.getElementById('editorialCanvas');
  const ctx = canvas.getContext('2d');
  const fileInput = document.getElementById('fileInput');
  const mainDropzone = document.getElementById('mainDropzone');
  const heroDropPanel = document.getElementById('heroDropPanel');
  const btnBrowseMain = document.getElementById('btnBrowseMain');
  const btnCameraMain = document.getElementById('btnCameraMain');
  const fabBrowse = document.getElementById('fabBrowse');
  const fabCamera = document.getElementById('fabCamera');
  const loadingOverlay = document.getElementById('loadingOverlay');
  const loadingText = document.getElementById('loadingText');
  const controlsToolbar = document.getElementById('controlsToolbar');
  const zoomSlider = document.getElementById('zoomSlider');
  const btnRotate = document.getElementById('btnRotate');
  const btnReset = document.getElementById('btnReset');
  const btnChangePhoto = document.getElementById('btnChangePhoto');
  const btnDownload = document.getElementById('btnDownload');
  const btnShareX = document.getElementById('btnShareX');
  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toastMsg');

  // Modals
  const webcamModal = document.getElementById('webcamModal');
  const webcamVideo = document.getElementById('webcamVideo');
  const closeWebcam = document.getElementById('closeWebcam');
  const btnSnapPhoto = document.getElementById('btnSnapPhoto');

  const shareModal = document.getElementById('shareModal');
  const closeShareModal = document.getElementById('closeShareModal');
  const shareModalImg = document.getElementById('shareModalImg');
  const modalBtnCopy = document.getElementById('modalBtnCopy');
  const modalBtnOpenX = document.getElementById('modalBtnOpenX');

  // Controls
  const paletteChips = document.querySelectorAll('.palette-chip');
  const tagBtns = document.querySelectorAll('.tag-btn');
  const sampleThumbs = document.querySelectorAll('.editorial-sample-thumb');

  // State
  const CANVAS_SIZE = 1200;
  let userImage = null;
  let webcamStream = null;

  let currentTheme = 'forest'; // 'forest', 'lagoon', 'sunset', 'monochrome'
  let currentCaption = 'shores of goa'; // 'shores of goa', 'february 2026', 'verified builder', 'none'

  let imgState = {
    x: CANVAS_SIZE / 2,
    y: CANVAS_SIZE / 2,
    scale: 1.0,
    rotation: 0,
    baseWidth: 0,
    baseHeight: 0
  };

  let isDragging = false;
  let dragStart = { x: 0, y: 0 };
  let touchStartDist = 0;
  let initialScale = 1.0;

  // Editorial Theme Palettes
  const THEMES = {
    forest: {
      bg: '#F7F3EA',
      cardBg: '#3F5D48',
      textPrimary: '#2A3F31',
      textSecondary: '#5B564C',
      accentBrass: '#C99A4B',
      scrim: 'rgba(42, 63, 49, 0.45)'
    },
    lagoon: {
      bg: '#F4F7F6',
      cardBg: '#26454C',
      textPrimary: '#172C31',
      textSecondary: '#4A6065',
      accentBrass: '#C99A4B',
      scrim: 'rgba(23, 44, 49, 0.45)'
    },
    sunset: {
      bg: '#FBF5F0',
      cardBg: '#D97757',
      textPrimary: '#5C2B1D',
      textSecondary: '#7A4839',
      accentBrass: '#C99A4B',
      scrim: 'rgba(92, 43, 29, 0.45)'
    },
    monochrome: {
      bg: '#F5F5F3',
      cardBg: '#201F1B',
      textPrimary: '#201F1B',
      textSecondary: '#5B564C',
      accentBrass: '#C99A4B',
      scrim: 'rgba(32, 31, 27, 0.55)'
    }
  };

  function init() {
    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;
    bindEvents();
    renderCanvas();
  }

  function bindEvents() {
    // Browse & Camera Buttons
    btnBrowseMain.addEventListener('click', (e) => { e.stopPropagation(); fileInput.click(); });
    fabBrowse.addEventListener('click', (e) => { e.stopPropagation(); fileInput.click(); });
    mainDropzone.addEventListener('click', () => fileInput.click());
    heroDropPanel.addEventListener('click', () => fileInput.click());

    btnCameraMain.addEventListener('click', (e) => { e.stopPropagation(); openWebcamModal(); });
    fabCamera.addEventListener('click', (e) => { e.stopPropagation(); openWebcamModal(); });

    fileInput.addEventListener('change', (e) => handleFileSelect(e.target.files));

    // Drag & Drop
    mainDropzone.addEventListener('dragover', (e) => e.preventDefault());
    mainDropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFileSelect(e.dataTransfer.files);
      }
    });

    // Sample Thumbs
    sampleThumbs.forEach(thumb => {
      thumb.addEventListener('click', (e) => {
        e.stopPropagation();
        const url = thumb.getAttribute('data-url');
        loadSampleImage(url);
      });
    });

    // Canvas Mouse & Touch Dragging
    canvas.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);

    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('touchend', onTouchEnd);
    canvas.addEventListener('wheel', onWheel, { passive: false });

    // Zoom & Tools
    zoomSlider.addEventListener('input', (e) => {
      imgState.scale = parseFloat(e.target.value);
      renderCanvas();
    });

    btnRotate.addEventListener('click', () => {
      imgState.rotation = (imgState.rotation + 90) % 360;
      renderCanvas();
    });

    btnReset.addEventListener('click', resetImageTransform);
    btnChangePhoto.addEventListener('click', () => fileInput.click());

    // Palette Chips
    paletteChips.forEach(chip => {
      chip.addEventListener('click', () => {
        paletteChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        currentTheme = chip.getAttribute('data-theme');
        renderCanvas();
      });
    });

    // Caption Tags
    tagBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        tagBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentCaption = btn.getAttribute('data-caption');
        renderCanvas();
      });
    });

    // Download & Share
    btnDownload.addEventListener('click', downloadAvatar);
    btnShareX.addEventListener('click', openShareModal);
    modalBtnCopy.addEventListener('click', copyCanvasToClipboard);
    modalBtnOpenX.addEventListener('click', launchXComposer);

    // Modal Close
    closeWebcam.addEventListener('click', closeWebcamModal);
    btnSnapPhoto.addEventListener('click', snapWebcamPhoto);
    closeShareModal.addEventListener('click', () => shareModal.classList.remove('active'));
  }

  // File Handling
  async function handleFileSelect(files) {
    if (!files || files.length === 0) return;
    const file = files[0];
    const fileName = file.name.toLowerCase();

    showLoading(true, 'Processing image...');

    try {
      if (fileName.endsWith('.heic') || fileName.endsWith('.heif') || file.type === 'image/heic' || file.type === 'image/heif') {
        if (typeof heic2any !== 'undefined') {
          const convertedBlob = await heic2any({ blob: file, toType: 'image/png', quality: 0.95 });
          const blobUrl = URL.createObjectURL(Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob);
          loadImageFromUrl(blobUrl);
        } else {
          showToast('HEIC decoder initializing, try JPG/PNG');
          showLoading(false);
        }
      } else {
        const reader = new FileReader();
        reader.onload = (e) => loadImageFromUrl(e.target.result);
        reader.readAsDataURL(file);
      }
    } catch (err) {
      console.error(err);
      showToast('Could not process image');
      showLoading(false);
    }
  }

  function loadSampleImage(url) {
    showLoading(true, 'Loading sample photo...');
    loadImageFromUrl(url, true);
  }

  function loadImageFromUrl(url, isCrossOrigin = false) {
    const img = new Image();
    if (isCrossOrigin) img.crossOrigin = 'anonymous';

    img.onload = () => {
      userImage = img;
      resetImageTransform();
      mainDropzone.style.display = 'none';
      heroDropPanel.classList.add('has-photo');
      heroDropPanel.style.backgroundImage = `url("${url}")`;
      controlsToolbar.classList.add('active');
      showLoading(false);
      renderCanvas();
    };

    img.onerror = () => {
      showToast('Error loading photo');
      showLoading(false);
    };

    img.src = url;
  }

  function resetImageTransform() {
    if (!userImage) return;
    imgState.x = CANVAS_SIZE / 2;
    imgState.y = CANVAS_SIZE / 2 - 20;
    imgState.rotation = 0;

    const aspect = userImage.width / userImage.height;
    if (aspect > 1) {
      imgState.baseHeight = CANVAS_SIZE * 0.9;
      imgState.baseWidth = imgState.baseHeight * aspect;
    } else {
      imgState.baseWidth = CANVAS_SIZE * 0.9;
      imgState.baseHeight = imgState.baseWidth / aspect;
    }

    imgState.scale = 1.0;
    zoomSlider.value = 1.0;
    renderCanvas();
  }

  // Webcam Stream
  async function openWebcamModal() {
    try {
      webcamStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });
      webcamVideo.srcObject = webcamStream;
      webcamModal.classList.add('active');
    } catch (err) {
      showToast('Camera blocked. Opening file browser...');
      fileInput.click();
    }
  }

  function closeWebcamModal() {
    if (webcamStream) {
      webcamStream.getTracks().forEach(t => t.stop());
      webcamStream = null;
    }
    webcamModal.classList.remove('active');
  }

  function snapWebcamPhoto() {
    if (!webcamVideo.srcObject) return;
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = webcamVideo.videoWidth || 1280;
    tempCanvas.height = webcamVideo.videoHeight || 720;
    const tCtx = tempCanvas.getContext('2d');
    tCtx.translate(tempCanvas.width, 0);
    tCtx.scale(-1, 1);
    tCtx.drawImage(webcamVideo, 0, 0);

    const snapshotUrl = tempCanvas.toDataURL('image/png');
    closeWebcamModal();
    loadImageFromUrl(snapshotUrl);
  }

  // Pointer & Touch Events
  function getCanvasCoords(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_SIZE / rect.width;
    const scaleY = CANVAS_SIZE / rect.height;
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  }

  function onPointerDown(e) {
    if (!userImage) return;
    isDragging = true;
    const coords = getCanvasCoords(e);
    dragStart.x = coords.x - imgState.x;
    dragStart.y = coords.y - imgState.y;
  }

  function onPointerMove(e) {
    if (!isDragging || !userImage) return;
    const coords = getCanvasCoords(e);
    imgState.x = coords.x - dragStart.x;
    imgState.y = coords.y - dragStart.y;
    renderCanvas();
  }

  function onPointerUp() { isDragging = false; }

  function onTouchStart(e) {
    if (!userImage) return;
    if (e.touches.length === 1) {
      isDragging = true;
      const coords = getCanvasCoords(e.touches[0]);
      dragStart.x = coords.x - imgState.x;
      dragStart.y = coords.y - imgState.y;
    } else if (e.touches.length === 2) {
      isDragging = false;
      touchStartDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      initialScale = imgState.scale;
    }
  }

  function onTouchMove(e) {
    if (!userImage) return;
    e.preventDefault();
    if (isDragging && e.touches.length === 1) {
      const coords = getCanvasCoords(e.touches[0]);
      imgState.x = coords.x - dragStart.x;
      imgState.y = coords.y - dragStart.y;
      renderCanvas();
    } else if (e.touches.length === 2) {
      const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      imgState.scale = Math.max(0.2, Math.min(3.0, initialScale * (dist / touchStartDist)));
      zoomSlider.value = imgState.scale;
      renderCanvas();
    }
  }

  function onTouchEnd() { isDragging = false; }

  function onWheel(e) {
    if (!userImage) return;
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.08 : -0.08;
    imgState.scale = Math.max(0.2, Math.min(3.0, imgState.scale + delta));
    zoomSlider.value = imgState.scale;
    renderCanvas();
  }

  // Editorial Shoreline Canvas Rendering (1200x1200)
  function renderCanvas() {
    const theme = THEMES[currentTheme] || THEMES.forest;

    // Background Natural Cream Field
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    ctx.fillStyle = theme.bg;
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Outer Decorative Brass Border Frame
    ctx.strokeStyle = theme.accentBrass;
    ctx.lineWidth = 4;
    ctx.strokeRect(40, 40, CANVAS_SIZE - 80, CANVAS_SIZE - 80);

    // Inner Card Boundary for Photo Window
    const pad = 70;
    const windowW = CANVAS_SIZE - pad * 2;
    const windowH = CANVAS_SIZE - pad * 2 - 80; // Leave room for editorial bottom banner

    if (userImage) {
      ctx.save();
      // Clip to rounded editorial card window
      ctx.beginPath();
      ctx.roundRect(pad, pad, windowW, windowH, 28);
      ctx.clip();

      // Transform & Render User Image
      ctx.translate(imgState.x, imgState.y);
      ctx.rotate((imgState.rotation * Math.PI) / 180);
      ctx.scale(imgState.scale, imgState.scale);
      ctx.drawImage(userImage, -imgState.baseWidth / 2, -imgState.baseHeight / 2, imgState.baseWidth, imgState.baseHeight);

      ctx.restore();
    } else {
      // Default Empty Window
      ctx.fillStyle = theme.cardBg;
      ctx.beginPath();
      ctx.roundRect(pad, pad, windowW, windowH, 28);
      ctx.fill();
    }

    // Soft Scrim & Frame Border
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(pad, pad, windowW, windowH, 28);
    
    // Soft Bottom Gradient Scrim over photo
    const scrimGrad = ctx.createLinearGradient(0, pad + windowH - 220, 0, pad + windowH);
    scrimGrad.addColorStop(0, 'rgba(0,0,0,0)');
    scrimGrad.addColorStop(1, theme.scrim);
    ctx.fillStyle = scrimGrad;
    ctx.fill();

    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();

    // Render Editorial Soft Serif Caption inside photo window (bottom)
    if (currentCaption !== 'none') {
      ctx.save();
      ctx.font = 'italic 400 48px "Fraunces", Georgia, serif';
      ctx.fillStyle = '#FBF7EE';
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0,0,0,0.4)';
      ctx.shadowBlur = 12;
      ctx.fillText(currentCaption, CANVAS_SIZE / 2, pad + windowH - 45);
      ctx.restore();
    }

    // Bottom Editorial Masthead Bar
    const footerY = CANVAS_SIZE - 95;
    ctx.save();
    
    ctx.font = 'italic 500 44px "Fraunces", Georgia, serif';
    ctx.fillStyle = theme.textPrimary;
    ctx.textAlign = 'left';
    ctx.fillText('HH Goa', pad + 10, footerY);

    ctx.font = '700 20px "Manrope", sans-serif';
    ctx.fillStyle = theme.accentBrass;
    ctx.fillText('2026', pad + 175, footerY - 12);

    ctx.font = '700 22px "Manrope", sans-serif';
    ctx.fillStyle = theme.textSecondary;
    ctx.textAlign = 'right';
    ctx.fillText('#FrameInGoa', CANVAS_SIZE - pad - 10, footerY);

    ctx.restore();
  }

  // Export & Share
  function downloadAvatar() {
    if (!userImage) { showToast('Please upload a photo first!'); return; }
    const dataUrl = canvas.toDataURL('image/png', 1.0);
    const link = document.createElement('a');
    link.download = `HH-Goa-2026-Editorial-Avatar-${Date.now()}.png`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Editorial Avatar downloaded!');
  }

  function openShareModal() {
    if (!userImage) { showToast('Please upload a photo first!'); return; }
    shareModalImg.src = canvas.toDataURL('image/png', 1.0);
    shareModal.classList.add('active');
    copyCanvasToClipboard(false);
  }

  function copyCanvasToClipboard(notify = true) {
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      try {
        if (navigator.clipboard && navigator.clipboard.write) {
          const item = new ClipboardItem({ 'image/png': blob });
          await navigator.clipboard.write([item]);
          if (notify) showToast('📋 Avatar copied to clipboard!');
        } else if (notify) {
          showToast('Image downloaded! Press Ctrl+V on X.');
        }
      } catch (err) {
        if (notify) showToast('Press Ctrl+V on X to paste image.');
      }
    }, 'image/png');
  }

  function launchXComposer() {
    const text = encodeURIComponent("Heading to #HHGoa2026 🌊⚡ Ready to build with the best on the shoreline! #FrameInGoa");
    window.open(`https://x.com/intent/post?text=${text}`, '_blank');
  }

  function showToast(msg) {
    toastMsg.textContent = msg;
    toast.classList.add('active');
    setTimeout(() => toast.classList.remove('active'), 3500);
  }

  function showLoading(show, text = 'Processing...') {
    if (show) {
      loadingText.textContent = text;
      loadingOverlay.classList.add('active');
    } else {
      loadingOverlay.classList.remove('active');
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
