import axios from 'axios';
import Face from '../model/model';
import getIp from '../utils/getIp';

const euclideanDistance = (a: number[], b: number[]) =>
    Math.sqrt(a.reduce((acc, val, i) => acc + Math.pow(val - b[i], 2), 0));

export const checkOrSaveFace = async (req: any, res: any) => {
    const { descriptor, image, location } = req.body;
    const ip = getIp(req);
    const device = req.useragent?.source;

    const faces = await Face.find();
    const matched = faces.find(
        (f: any) => euclideanDistance(f.descriptor, descriptor) < 0.6
    );

    if (matched) return res.json({ message: 'Face exists' });

    await Face.create({ descriptor, image, ip, device, location });
    res.status(201).json({ message: 'New face saved' });
};

export const getLocation = async (req: any, res: any) => {
    try {
        // Use a more reliable IP geolocation service
        const response = await axios.get('http://ip-api.com/json/', {
            timeout: 5000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        console.log('Location API response:', response.data);

        // Transform the response to match expected format
        const locationData = {
            ip: response.data.query || 'unknown',
            city: response.data.city || 'unknown',
            region: response.data.regionName || 'unknown',
            country_name: response.data.country || 'unknown',
            latitude: response.data.lat || 0,
            longitude: response.data.lon || 0,
        };

        res.json(locationData);
    } catch (error) {
        console.error('Location API error:', error);

        // Fallback: just return the client's IP address
        const clientIp = getIp(req);
        const fallbackData = {
            ip: clientIp || 'unknown',
            city: 'unknown',
            region: 'unknown',
            country_name: 'unknown',
            latitude: 0,
            longitude: 0,
        };

        res.json(fallbackData);
    }
};

// Alternative: If you want to completely avoid external APIs, use this version instead:
/*
export const getLocation = async (req: any, res: any) => {
    const clientIp = getIp(req);
    const locationData = {
        ip: clientIp || 'unknown',
        city: 'unknown',
        region: 'unknown',
        country_name: 'unknown',
        latitude: 0,
        longitude: 0,
    };
    
    res.json(locationData);
};
*/