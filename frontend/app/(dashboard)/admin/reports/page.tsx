'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const data = [
    { name: 'Jan', attendance: 95, leaves: 5 },
    { name: 'Feb', attendance: 92, leaves: 8 },
    { name: 'Mar', attendance: 98, leaves: 2 },
    { name: 'Apr', attendance: 90, leaves: 10 },
    { name: 'May', attendance: 94, leaves: 6 },
    { name: 'Jun', attendance: 96, leaves: 4 },
];

export default function ReportsPage() {
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Analytics & Reports</h1>

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="col-span-2">
                    <CardHeader>
                        <CardTitle>Attendance Trends (Last 6 Months)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={data}
                                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="attendance" fill="#2563eb" name="Attendance %" />
                                    <Bar dataKey="leaves" fill="#f87171" name="Leaves Taken" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
