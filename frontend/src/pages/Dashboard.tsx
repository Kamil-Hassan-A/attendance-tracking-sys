import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

function Dashboard() {

  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Top Bar */}
      <div className="flex justify-between items-center px-10 py-6 bg-white shadow-sm">

        <h1 className="text-2xl font-bold text-gray-800">
          Smart Attendance System
        </h1>

        <Button onClick={() => navigate("/login")}>
          Login
        </Button>

      </div>

      {/* Page Content */}
      <div className="p-10">

        <h2 className="text-xl font-semibold mb-6 text-gray-700">
          Dashboard
        </h2>

        <div className="grid grid-cols-3 gap-8">

          {/* Students Card */}
          <Card
            className="cursor-pointer hover:shadow-lg transition"
            onClick={() => navigate("/students")}
          >
            <CardHeader>
              <CardTitle>Students</CardTitle>
            </CardHeader>

            <CardContent className="text-gray-600">
              Manage student records and details
            </CardContent>
          </Card>

          {/* Attendance Card */}
          <Card
            className="cursor-pointer hover:shadow-lg transition"
            onClick={() => navigate("/attendance")}
          >
            <CardHeader>
              <CardTitle>Mark Attendance</CardTitle>
            </CardHeader>

            <CardContent className="text-gray-600">
              Record daily attendance for students
            </CardContent>
          </Card>

          {/* Reports Card */}
          <Card
            className="cursor-pointer hover:shadow-lg transition"
            onClick={() => navigate("/reports")}
          >
            <CardHeader>
              <CardTitle>Reports</CardTitle>
            </CardHeader>

            <CardContent className="text-gray-600">
              View attendance statistics and reports
            </CardContent>
          </Card>

        </div>

      </div>

    </div>
  )
}

export default Dashboard