import { Request, Response } from 'express';
import Admission from '../models/Admission';

export const getAllAdmissions = async (req: Request, res: Response) => {
    try {
        const admissions = await Admission.find().sort({ appliedAt: -1 });
        res.json(admissions);
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
};

export const getAdmissionById = async (req: Request, res: Response) => {
    try {
        const admission = await Admission.findById(req.params.id);
        if (!admission) return res.status(404).json({ message: 'Admission not found' });
        res.json(admission);
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
};

export const createAdmission = async (req: Request, res: Response) => {
    try {
        console.log('Received Admission Data:', JSON.stringify(req.body).substring(0, 200) + '...');
        const newAdmission = new Admission(req.body);
        const savedAdmission = await newAdmission.save();
        res.status(201).json(savedAdmission);
    } catch (err: any) {
        console.error('Admission Creation Error:', err.message);
        if (err.name === 'ValidationError') {
            console.error('Validation Errors:', JSON.stringify(err.errors, null, 2));
            return res.status(400).json({ message: 'Validation Error', errors: err.errors });
        }
        res.status(400).json({ message: err.message });
    }
};

export const updateAdmission = async (req: Request, res: Response) => {
    try {
        const updatedAdmission = await Admission.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        res.json(updatedAdmission);
    } catch (err: any) {
        res.status(400).json({ message: err.message });
    }
};

export const deleteAdmission = async (req: Request, res: Response) => {
    try {
        await Admission.findByIdAndDelete(req.params.id);
        res.json({ message: 'Admission deleted' });
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
};
