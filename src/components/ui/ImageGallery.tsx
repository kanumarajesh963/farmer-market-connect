import { useState, useRef, useCallback } from 'react';
import { Box, IconButton, Stack, Typography } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import CloseIcon from '@mui/icons-material/Close';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

const FALLBACK_IMAGE =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="100%" height="100%" fill="#e8ece7"/><text x="50%" y="50%" font-family="sans-serif" font-size="16" fill="#8a978f" text-anchor="middle">No photo</text></svg>`
  );

function Lightbox({
  images,
  index,
  onIndex,
  onClose,
}: {
  images: string[];
  index: number;
  onIndex: (i: number) => void;
  onClose: () => void;
}) {
  const [zoom, setZoom] = useState(1);
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  const resetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const go = (delta: number) => {
    resetView();
    onIndex((index + delta + images.length) % images.length);
  };

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 1400,
        bgcolor: 'rgba(8,12,9,0.94)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ p: 1.5 }} onClick={(e) => e.stopPropagation()}>
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', pl: 1 }}>
          {index + 1} / {images.length}
        </Typography>
        <Stack direction="row" spacing={0.5}>
          <IconButton onClick={() => setZoom((z) => Math.max(1, z - 0.5))} sx={{ color: '#fff' }} aria-label="Zoom out">
            <ZoomOutIcon />
          </IconButton>
          <IconButton onClick={() => setZoom((z) => Math.min(4, z + 0.5))} sx={{ color: '#fff' }} aria-label="Zoom in">
            <ZoomInIcon />
          </IconButton>
          <IconButton onClick={onClose} sx={{ color: '#fff' }} aria-label="Close">
            <CloseIcon />
          </IconButton>
        </Stack>
      </Stack>

      <Box
        sx={{ flex: 1, display: 'grid', placeItems: 'center', overflow: 'hidden', position: 'relative', touchAction: 'none' }}
        onClick={(e) => e.stopPropagation()}
        onWheel={(e) => {
          e.preventDefault();
          setZoom((z) => Math.min(4, Math.max(1, z - e.deltaY * 0.0015)));
        }}
        onPointerDown={(e) => {
          dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
        }}
        onPointerMove={(e) => {
          if (!dragStart.current || zoom <= 1) return;
          setPan({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y });
        }}
        onPointerUp={() => {
          dragStart.current = null;
        }}
        onPointerLeave={() => {
          dragStart.current = null;
        }}
        onDoubleClick={() => (zoom > 1 ? resetView() : setZoom(2))}
      >
        {images.length > 1 && (
          <IconButton
            onClick={() => go(-1)}
            sx={{ position: 'absolute', left: 8, color: '#fff', bgcolor: 'rgba(0,0,0,0.3)', '&:hover': { bgcolor: 'rgba(0,0,0,0.5)' } }}
          >
            <ChevronLeftIcon />
          </IconButton>
        )}
        <Box
          component="img"
          src={images[index] || FALLBACK_IMAGE}
          alt=""
          draggable={false}
          sx={{
            maxWidth: '92vw',
            maxHeight: '78dvh',
            objectFit: 'contain',
            cursor: zoom > 1 ? 'grab' : 'zoom-in',
            transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
            transition: dragStart.current ? 'none' : 'transform 150ms ease-out',
            userSelect: 'none',
          }}
        />
        {images.length > 1 && (
          <IconButton
            onClick={() => go(1)}
            sx={{ position: 'absolute', right: 8, color: '#fff', bgcolor: 'rgba(0,0,0,0.3)', '&:hover': { bgcolor: 'rgba(0,0,0,0.5)' } }}
          >
            <ChevronRightIcon />
          </IconButton>
        )}
      </Box>

      {images.length > 1 && (
        <Stack direction="row" spacing={1} sx={{ p: 1.5, overflowX: 'auto' }} onClick={(e) => e.stopPropagation()}>
          {images.map((img, i) => (
            <Box
              key={i}
              component="img"
              src={img || FALLBACK_IMAGE}
              onClick={() => {
                resetView();
                onIndex(i);
              }}
              sx={{
                width: 52,
                height: 52,
                objectFit: 'cover',
                borderRadius: 1,
                flexShrink: 0,
                cursor: 'pointer',
                opacity: i === index ? 1 : 0.5,
                border: i === index ? '2px solid #fff' : '2px solid transparent',
              }}
            />
          ))}
        </Stack>
      )}
    </Box>
  );
}

export default function ImageGallery({ images, alt, height = 320 }: { images: string[]; alt: string; height?: number }) {
  const list = images.length > 0 ? images : [FALLBACK_IMAGE];
  const [active, setActive] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  return (
    <Box>
      <Box
        onClick={() => setLightboxOpen(true)}
        sx={{ position: 'relative', cursor: 'zoom-in', borderRadius: 1, overflow: 'hidden' }}
      >
        <Box component="img" src={list[active]} alt={alt} sx={{ width: '100%', height, objectFit: 'cover', display: 'block' }} />
        <Stack
          direction="row"
          spacing={0.5}
          alignItems="center"
          sx={{
            position: 'absolute',
            bottom: 10,
            right: 10,
            bgcolor: 'rgba(0,0,0,0.55)',
            color: '#fff',
            px: 1,
            py: 0.4,
            borderRadius: 4,
          }}
        >
          <ZoomInIcon sx={{ fontSize: 14 }} />
          <Typography variant="caption">{list.length > 1 ? `${active + 1}/${list.length}` : 'Tap to zoom'}</Typography>
        </Stack>
      </Box>

      {list.length > 1 && (
        <Stack direction="row" spacing={1} sx={{ mt: 1, overflowX: 'auto', pb: 0.5 }}>
          {list.map((img, i) => (
            <Box
              key={i}
              component={motion.img}
              whileTap={{ scale: 0.94 }}
              src={img}
              alt=""
              onClick={() => setActive(i)}
              sx={{
                width: 60,
                height: 60,
                objectFit: 'cover',
                borderRadius: 1,
                flexShrink: 0,
                cursor: 'pointer',
                border: i === active ? '2px solid' : '2px solid transparent',
                borderColor: i === active ? 'primary.main' : 'transparent',
                opacity: i === active ? 1 : 0.75,
              }}
            />
          ))}
        </Stack>
      )}

      <AnimatePresence>
        {lightboxOpen && (
          <Lightbox images={list} index={active} onIndex={setActive} onClose={() => setLightboxOpen(false)} />
        )}
      </AnimatePresence>
    </Box>
  );
}
