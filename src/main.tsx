import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { DOC_TITLE } from './constants/documentTitles';

const isPortalWindow =
  window.location.pathname === '/portal' || window.location.pathname.startsWith('/portal/');
const isTeacherWindow =
  window.location.pathname === '/teacher' || window.location.pathname.startsWith('/teacher/');
const isCameraWindow =
  window.location.pathname === '/camera' || window.location.pathname.startsWith('/camera/');
const isAdminWindow =
  window.location.pathname === '/admin' || window.location.pathname.startsWith('/admin/');

function setHeadIcons() {
  document.querySelectorAll('link[rel="icon"], link[rel="apple-touch-icon"]').forEach((node) => {
    node.remove();
  });

  if (isPortalWindow) {
    const favicon = document.createElement('link');
    favicon.rel = 'icon';
    favicon.href = '/favicon.ico';
    document.head.appendChild(favicon);

    const appleTouchIcon = document.createElement('link');
    appleTouchIcon.rel = 'apple-touch-icon';
    appleTouchIcon.href = '/apple-touch-icon.png';
    document.head.appendChild(appleTouchIcon);
    return;
  }

  if (isTeacherWindow) {
    const teacherFavicon = document.createElement('link');
    teacherFavicon.rel = 'icon';
    teacherFavicon.href = '/teacher-favicon.ico';
    document.head.appendChild(teacherFavicon);

    const teacherTouchIcon = document.createElement('link');
    teacherTouchIcon.rel = 'apple-touch-icon';
    teacherTouchIcon.href = '/teacher-touch-icon.png';
    document.head.appendChild(teacherTouchIcon);
    return;
  }

  if (isCameraWindow) {
    const camIcon = document.createElement('link');
    camIcon.rel = 'icon';
    camIcon.type = 'image/png';
    camIcon.href = '/camera.png';
    document.head.appendChild(camIcon);

    const camTouch = document.createElement('link');
    camTouch.rel = 'apple-touch-icon';
    camTouch.href = '/camera.png';
    document.head.appendChild(camTouch);
    return;
  }

  if (isAdminWindow) {
    const adminIcon = document.createElement('link');
    adminIcon.rel = 'icon';
    adminIcon.type = 'image/avif';
    adminIcon.href = '/admin-clerk-with-laptop-icon_1076610-101107.avif';
    document.head.appendChild(adminIcon);

    const adminTouch = document.createElement('link');
    adminTouch.rel = 'apple-touch-icon';
    adminTouch.href = '/admin-clerk-with-laptop-icon_1076610-101107.avif';
    document.head.appendChild(adminTouch);
    return;
  }

  const emptyFavicon = document.createElement('link');
  emptyFavicon.rel = 'icon';
  emptyFavicon.href =
    'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 1 1%22%3E%3C/svg%3E';
  document.head.appendChild(emptyFavicon);
}

setHeadIcons();

if (isCameraWindow) {
  document.title = DOC_TITLE.camera;
}

if (isAdminWindow) {
  document.title = DOC_TITLE.admin;
}

if (isTeacherWindow) {
  document.title = DOC_TITLE.teacher;
}

// Register SW only for the student portal window.
if ('serviceWorker' in navigator && isPortalWindow) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/portal' }).catch((_err) => {
      // Ignore registration errors in UI; app remains functional online.
    });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
