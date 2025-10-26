export type Job = {
  id: string
  title: string
  company: string
  location: string
  status: 'pending' | 'approved' | 'rejected'
}

export const JOBS: Job[] = [
  { id: 'j1', title: 'Frontend Engineer', company: 'Acme', location: 'Remote', status: 'pending' },
  { id: 'j2', title: 'Backend Engineer', company: 'Globex', location: 'NYC', status: 'approved' },
  { id: 'j3', title: 'Data Analyst', company: 'Initech', location: 'SF', status: 'pending' },
]



