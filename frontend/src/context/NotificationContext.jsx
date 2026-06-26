import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const { auth } = useAuth();
    const [socket, setSocket] = useState(null);
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        if (!auth?.token) {
            if (socket) {
                socket.disconnect();
                setSocket(null);
            }
            return;
        }

        const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:3000', {
            withCredentials: true,
            transports: ['websocket', 'polling']
        });

        newSocket.on('connect', () => {
            console.log('Connected to notification server');
            // Join a personal room for direct notifications
            if (auth?.user?.id) {
                newSocket.emit('join', auth.user.id);
            }
            // Join a role-based room (e.g. admins get all emergency alerts)
            if (auth?.user?.role) {
                newSocket.emit('join', auth.user.role);
            }
        });

        newSocket.on('notification', (data) => {
            setNotifications(prev => [data, ...prev]);
            
            // Show toast
            switch(data.type) {
                case 'success': toast.success(data.message); break;
                case 'error': toast.error(data.message); break;
                case 'warning': toast.warning(data.message); break;
                case 'info': toast.info(data.message); break;
                default: toast(data.message);
            }
        });

        setSocket(newSocket);

        return () => newSocket.disconnect();
    }, [auth?.token]);

    const markAsRead = (id) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    };

    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <NotificationContext.Provider value={{ socket, notifications, unreadCount, markAsRead, markAllAsRead }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) throw new Error('useNotifications must be used within NotificationProvider');
    return context;
};
