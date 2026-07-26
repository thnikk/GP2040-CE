import React, { createContext, useCallback, useContext, useState, useRef } from 'react';
import { createPortal } from 'react-dom';

type ToastVariant = 'success' | 'error' | 'info' | 'warning';

type Toast = {
	id: number;
	message: string;
	variant: ToastVariant;
	exiting: boolean;
};

type ToastContextValue = {
	showToast: (message: string, variant?: ToastVariant, duration?: number) => number;
	dismissToast: (id: number) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export const useToast = () => {
	const ctx = useContext(ToastContext);
	if (!ctx) throw new Error('useToast must be used within ToastProvider');
	return ctx;
};

let toastId = 0;

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
	const [toasts, setToasts] = useState<Toast[]>([]);
	const timersRef = useRef(new Map());

	const dismissToast = useCallback((id: number) => {
		const timer = timersRef.current.get(id);
		if (timer) {
			clearTimeout(timer);
			timersRef.current.delete(id);
		}
		setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
		setTimeout(() => {
			setToasts(prev => prev.filter(t => t.id !== id));
		}, 300);
	}, []);

	const showToast = useCallback((message: string, variant: ToastVariant = 'success', duration = 4000): number => {
		const id = ++toastId;
		setToasts(prev => [...prev, { id, message, variant, exiting: false }]);

		const timer = setTimeout(() => {
			dismissToast(id);
		}, duration);
		timersRef.current.set(id, timer);

		return id;
	}, [dismissToast]);

	return (
		<ToastContext.Provider value={{ showToast, dismissToast }}>
			{children}
			{createPortal(
				<div className="toast-container">
					{toasts.map(t => (
						<div
							key={t.id}
							className={`toast toast-${t.variant}${t.exiting ? ' exiting' : ''}`}
							onClick={() => dismissToast(t.id)}
							role="alert"
						>
							{t.message}
						</div>
					))}
				</div>,
				document.body,
			)}
		</ToastContext.Provider>
	);
};

export default ToastContext;
