import React, { useEffect, useRef, useState } from 'react';
import type { OrgDataset } from '../types';

interface QrCodeScannerModalProps {
  org: OrgDataset;
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: () => Promise<void>;
}

export const QrCodeScannerModal: React.FC<QrCodeScannerModalProps> = ({
  org,
  isOpen,
  onClose,
  onScanSuccess,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraState, setCameraState] = useState<
    'initializing' | 'streaming' | 'fallback' | 'detected'
  >('initializing');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [autoDetectEnabled, setAutoDetectEnabled] = useState<boolean>(true);

  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const startCameraStream = async (preferredFacing: 'environment' | 'user') => {
    stopCameraStream();
    setCameraState('initializing');
    setCameraError(null);
    setScanProgress(0);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraState('fallback');
      setCameraError('Camera API unavailable in this browser context. Using simulated optical scanner.');
      return;
    }

    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: preferredFacing },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setCameraState('streaming');
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Camera permission denied or no camera hardware found.';
      setCameraError(message);
      setCameraState('fallback');
    }
  };

  useEffect(() => {
    if (!isOpen) {
      stopCameraStream();
      return;
    }
    startCameraStream(facingMode);
    return () => {
      stopCameraStream();
    };
  }, [isOpen, facingMode]);

  // Simulated QR code acquisition progress while camera is active or in fallback mode
  useEffect(() => {
    if (!isOpen || !autoDetectEnabled) return;
    if (cameraState !== 'streaming' && cameraState !== 'fallback') return;

    const interval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 5;
      });
    }, 160);

    return () => clearInterval(interval);
  }, [isOpen, cameraState, autoDetectEnabled]);

  useEffect(() => {
    if (scanProgress === 100 && cameraState !== 'detected') {
      handleTriggerDetection();
    }
  }, [scanProgress]);

  const handleTriggerDetection = async () => {
    setCameraState('detected');
    setScanProgress(100);
    setTimeout(async () => {
      stopCameraStream();
      await onScanSuccess();
    }, 650);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-primary/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface-container-lowest rounded-xl max-w-lg w-full p-space-lg shadow-xl border border-outline-variant/20 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between mb-space-md">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-primary-container text-on-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">qr_code_scanner</span>
            </div>
            <div>
              <h3 className="font-headline-sm text-headline-sm text-primary leading-tight">
                Optical QR Worksite Check-In
              </h3>
              <span className="font-label-sm text-label-sm text-on-surface-variant">
                Point camera at worksite gate terminal • {org.rosterId}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              stopCameraStream();
              onClose();
            }}
            aria-label="Close QR scanner"
            className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Camera Viewport Container */}
        <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-[#110d22] border border-outline-variant/30 shadow-inner flex items-center justify-center">
          {/* Live HTML5 Video Element */}
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              cameraState === 'streaming' ? 'opacity-100' : 'opacity-20'
            }`}
          />

          {/* Fallback / Initializing Backdrop */}
          {cameraState === 'initializing' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-space-md text-center">
              <span className="material-symbols-outlined text-[36px] text-[#6ffbbe] animate-spin mb-2">
                sync
              </span>
              <p className="font-label-lg text-label-lg">Requesting Camera Access...</p>
              <p className="font-body-sm text-body-sm text-[#cac2e0] mt-0.5">
                Initializing optical sensor for {org.siteBadge}
              </p>
            </div>
          )}

          {cameraState === 'fallback' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-space-md text-center bg-gradient-to-b from-[#110d22]/90 to-[#262238]/95">
              <span className="material-symbols-outlined text-[48px] text-[#cac2e0] mb-1">
                qr_code_2
              </span>
              <p className="font-label-lg text-label-lg text-white">
                Simulated Optical Feed Active
              </p>
              {cameraError && (
                <p className="font-label-sm text-label-sm text-[#cac2e0] max-w-xs mt-1">
                  {cameraError}
                </p>
              )}
            </div>
          )}

          {/* Viewfinder Target Frame & Laser Line */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-6">
            <div
              className={`relative w-52 h-52 rounded-2xl transition-all duration-300 ${
                cameraState === 'detected'
                  ? 'ring-4 ring-[#4edea3] bg-[#4edea3]/15 scale-105'
                  : 'ring-1 ring-white/25 bg-black/10'
              }`}
            >
              {/* 4 Corner Brackets */}
              <span className="absolute -top-0.5 -left-0.5 w-7 h-7 border-t-4 border-l-4 border-[#6ffbbe] rounded-tl-xl"></span>
              <span className="absolute -top-0.5 -right-0.5 w-7 h-7 border-t-4 border-r-4 border-[#6ffbbe] rounded-tr-xl"></span>
              <span className="absolute -bottom-0.5 -left-0.5 w-7 h-7 border-b-4 border-l-4 border-[#6ffbbe] rounded-bl-xl"></span>
              <span className="absolute -bottom-0.5 -right-0.5 w-7 h-7 border-b-4 border-r-4 border-[#6ffbbe] rounded-br-xl"></span>

              {/* Scanning Laser Beam */}
              {cameraState !== 'detected' && (
                <div
                  className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-[#6ffbbe] to-transparent shadow-[0_0_12px_#6ffbbe] transition-all duration-150"
                  style={{ top: `${Math.min(Math.max(scanProgress, 8), 92)}%` }}
                />
              )}

              {/* Detected Checkmark Overlay */}
              {cameraState === 'detected' && (
                <div className="w-full h-full flex flex-col items-center justify-center text-white">
                  <div className="w-12 h-12 rounded-full bg-[#009f6e] text-white flex items-center justify-center shadow-lg mb-2">
                    <span className="material-symbols-outlined text-[28px]">check</span>
                  </div>
                  <span className="font-label-md text-label-md font-semibold text-[#6ffbbe] bg-[#110d22]/90 px-2.5 py-0.5 rounded-full">
                    QR Token Verified
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Top-Left Live Camera Badge */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/65 text-white font-label-sm text-label-sm">
            <span
              className={`w-2 h-2 rounded-full ${
                cameraState === 'streaming'
                  ? 'bg-[#4edea3]'
                  : cameraState === 'detected'
                    ? 'bg-[#4edea3]'
                    : 'bg-amber-400'
              }`}
            ></span>
            <span>
              {cameraState === 'streaming'
                ? 'Live Camera Feed'
                : cameraState === 'detected'
                  ? 'Beacon Locked'
                  : 'Optical Simulation'}
            </span>
          </div>

          {/* Top-Right Camera Flip & Retry Controls */}
          <div className="absolute top-3 right-3 flex items-center gap-1.5">
            <button
              type="button"
              onClick={() =>
                setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'))
              }
              title="Switch Camera (Front / Rear)"
              className="p-1.5 rounded-lg bg-black/65 hover:bg-black/80 text-white transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">flip_camera_ios</span>
            </button>
            <button
              type="button"
              onClick={() => startCameraStream(facingMode)}
              title="Restart Camera Stream"
              className="p-1.5 rounded-lg bg-black/65 hover:bg-black/80 text-white transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">refresh</span>
            </button>
          </div>

          {/* Bottom Progress & Cryptographic Target Bar */}
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/85 via-black/50 to-transparent p-space-sm flex items-center justify-between text-white font-label-sm text-label-sm">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-[#6ffbbe]">
                my_location
              </span>
              <span>{org.geofenceLabel}</span>
            </div>
            <span className="font-mono tabular-nums text-[#6ffbbe]">
              {scanProgress}% Scanned
            </span>
          </div>
        </div>

        {/* Scanner Options & Metadata */}
        <div className="mt-space-md bg-surface-container-low rounded-lg p-space-sm flex items-center justify-between gap-space-sm">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-secondary">
              verified_user
            </span>
            <div className="font-body-sm text-body-sm text-on-surface">
              Target Site: <strong>{org.siteBadge}</strong>
            </div>
          </div>
          <label className="flex items-center gap-1.5 cursor-pointer select-none font-label-sm text-label-sm text-on-surface-variant shrink-0">
            <input
              type="checkbox"
              checked={autoDetectEnabled}
              onChange={(e) => setAutoDetectEnabled(e.target.checked)}
              className="accent-secondary rounded cursor-pointer"
            />
            <span>Auto-detect</span>
          </label>
        </div>

        {/* Modal Footer Actions */}
        <div className="mt-space-md flex items-center justify-between gap-space-sm">
          <button
            type="button"
            onClick={() => {
              stopCameraStream();
              onClose();
            }}
            className="px-4 py-2.5 rounded-lg bg-surface-container-high hover:bg-surface-variant text-on-surface font-label-lg text-label-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleTriggerDetection}
            disabled={cameraState === 'detected'}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-primary-container hover:bg-primary text-on-primary font-label-lg text-label-lg transition-colors shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">qr_code_scanner</span>
            <span>
              {cameraState === 'detected'
                ? 'Recording Check-In...'
                : 'Capture & Verify QR Check-In'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
