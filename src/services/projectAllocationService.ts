import { db } from '../lib/firebase';
import { collection, doc, setDoc, getDocs, deleteDoc, updateDoc, query, where, serverTimestamp } from 'firebase/firestore';

export interface AllocatedProject {
    id: string;
    title: string;
    description: string;
    facultyUid: string;
    studentUids: string[];
    createdAt: string;
    status: 'ongoing' | 'completed' | 'paused';
}

export async function createProject(facultyUid: string, title: string, description: string, studentUids: string[] = []): Promise<AllocatedProject> {
    const projRef = doc(collection(db, 'facultyProjects'));
    const newProj: AllocatedProject = {
        id: projRef.id,
        title,
        description,
        facultyUid,
        studentUids,
        createdAt: new Date().toISOString(),
        status: 'ongoing'
    };
    await setDoc(projRef, { ...newProj, createdAt: serverTimestamp() });
    return newProj;
}

export async function getFacultyProjects(facultyUid: string): Promise<AllocatedProject[]> {
    const q = query(collection(db, 'facultyProjects'), where('facultyUid', '==', facultyUid));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => {
        const data = d.data();
        return {
            id: d.id,
            title: data.title || '',
            description: data.description || '',
            facultyUid: data.facultyUid,
            studentUids: data.studentUids || [],
            createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
            status: data.status || 'ongoing'
        };
    });
}

export async function updateProjectAllocation(projectId: string, studentUids: string[]): Promise<void> {
    await updateDoc(doc(db, 'facultyProjects', projectId), { studentUids });
}

export async function deleteProject(projectId: string): Promise<void> {
    await deleteDoc(doc(db, 'facultyProjects', projectId));
}
