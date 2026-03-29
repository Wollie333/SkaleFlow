'use client';

import { useState, useEffect } from 'react';
import { Button } from './button';
import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false,
}: ConfirmModalProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      const timeout = setTimeout(() => setIsVisible(false), 200);
      return () => clearTimeout(timeout);
    }
  }, [isOpen]);

  if (!isVisible && !isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
  };

  const variantStyles = {
    danger: {
      icon: 'text-red-500',
      iconBg: 'bg-red-500/10',
      confirmBtn: 'bg-red-500 hover:bg-red-600 text-white',
    },
    warning: {
      icon: 'text-amber-500',
      iconBg: 'bg-amber-500/10',
      confirmBtn: 'bg-amber-500 hover:bg-amber-600 text-white',
    },
    info: {
      icon: 'text-teal',
      iconBg: 'bg-teal/10',
      confirmBtn: 'bg-teal hover:bg-teal-light text-white',
    },
  };

  const style = variantStyles[variant];

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center transition-all duration-200 ${
        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-dark/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className={`relative bg-cream-warm rounded-xl shadow-2xl border border-stone/10 w-full max-w-md mx-4 transition-all duration-200 ${
          isOpen ? 'scale-100' : 'scale-95'
        }`}
        onClick={e => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-stone hover:text-charcoal hover:bg-stone/10 transition-colors"
          disabled={isLoading}
        >
          <XMarkIcon className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="p-6">
          {/* Icon */}
          <div className={`w-12 h-12 rounded-full ${style.iconBg} flex items-center justify-center mb-4`}>
            <ExclamationTriangleIcon className={`w-6 h-6 ${style.icon}`} />
          </div>

          {/* Title */}
          <h3 className="text-lg font-semibold text-charcoal mb-2">{title}</h3>

          {/* Message */}
          <p className="text-sm text-stone mb-6">{message}</p>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Button
              onClick={handleConfirm}
              disabled={isLoading}
              className={`flex-1 ${style.confirmBtn}`}
            >
              {isLoading ? 'Processing...' : confirmText}
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              disabled={isLoading}
              className="flex-1"
            >
              {cancelText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Hook for managing confirm modal state
export function useConfirmModal() {
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant?: 'danger' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    variant: 'danger',
  });

  const confirm = (
    title: string,
    message: string,
    variant: 'danger' | 'warning' | 'info' = 'danger'
  ): Promise<boolean> => {
    return new Promise(resolve => {
      setModalState({
        isOpen: true,
        title,
        message,
        variant,
        onConfirm: () => {
          setModalState(prev => ({ ...prev, isOpen: false }));
          resolve(true);
        },
      });
    });
  };

  const closeModal = () => {
    setModalState(prev => ({ ...prev, isOpen: false }));
  };

  return {
    confirm,
    closeModal,
    modalState,
    ConfirmModalComponent: () => (
      <ConfirmModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        onConfirm={modalState.onConfirm}
        title={modalState.title}
        message={modalState.message}
        variant={modalState.variant}
      />
    ),
  };
}
