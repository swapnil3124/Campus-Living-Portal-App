import { Request, Response } from 'express';
import SystemConfig from '../models/SystemConfig';

export const getConfig = async (req: Request, res: Response) => {
    try {
        const { key } = req.params;
        let config = await SystemConfig.findOne({ key });
        if (!config) {
            // Provide defaults if not found
            if (key === 'registration') {
                config = new SystemConfig({
                    key,
                    value: {
                        startDate: new Date().toISOString(),
                        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                        isOpen: true,
                        departments: ['Computer', 'IT', 'Mechanical', 'E&TC', 'Civil', 'Automobile'],
                        categories: ['Open', 'OBC', 'SC', 'ST', 'VJNT', 'SBC', 'EWS']
                    }
                });
            } else {
                return res.status(404).json({ message: 'Config not found' });
            }
        }
        res.json(config);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const setConfig = async (req: Request, res: Response) => {
    try {
        const { key, value } = req.body;
        const config = await SystemConfig.findOneAndUpdate(
            { key },
            { value },
            { upsert: true, new: true }
        );
        res.json(config);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const getAllConfigs = async (req: Request, res: Response) => {
    try {
        const configs = await SystemConfig.find();
        res.json(configs);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
