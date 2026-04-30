import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../config/config';

const useAxiosJWT = () => {
    const [token, setToken]   = useState('');
    const [expire, setExpire] = useState(0);
    const [name, setName]     = useState('');
    const navigate            = useNavigate();

    // Refs agar interceptor selalu baca nilai terbaru tanpa re-create axiosJWT
    const tokenRef  = useRef(token);
    const expireRef = useRef(expire);
    tokenRef.current  = token;
    expireRef.current = expire;

    const refreshToken = useCallback(async () => {
        try {
            const res     = await axios.get(`${API_BASE_URL}/token`, { withCredentials: true });
            const decoded = jwtDecode(res.data.accessToken);
            setToken(res.data.accessToken);
            setExpire(decoded.exp);
            setName(decoded.name || '');
            tokenRef.current  = res.data.accessToken;
            expireRef.current = decoded.exp;
            return res.data.accessToken;
        } catch {
            navigate('/login');
            return null;
        }
    }, [navigate]);

    useEffect(() => { refreshToken(); }, []);

    // axiosJWT stabil — dibuat sekali dengan useRef
    const axiosJWT = useRef(axios.create()).current;

    useEffect(() => {
        const id = axiosJWT.interceptors.request.use(async (config) => {
            const now = new Date().getTime();
            let tok = tokenRef.current;
            if (!tok || expireRef.current * 1000 < now) {
                tok = await refreshToken();
            }
            if (tok) config.headers.Authorization = `Bearer ${tok}`;
            return config;
        }, (err) => Promise.reject(err));

        return () => axiosJWT.interceptors.request.eject(id);
    }, [refreshToken]);

    return { token, expire, name, axiosJWT, refreshToken };
};

export default useAxiosJWT;
