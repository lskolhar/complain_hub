import { useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import MainLayout from "@/components/MainLayout";
import StatisticCard from "@/components/StatisticCard";
import ComplaintListItem from "@/components/ComplaintListItem";
import { Button } from "@/components/ui/button";
import { Complaint } from "@/lib/types";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { db } from "@/firebaseConfig";
import {
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  ArrowRight,
  PlusCircle,
} from "lucide-react";

const Dashboard = () => {
  const { user, isAdmin } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchComplaints = async () => {
      setIsLoading(true);
      setError("");

      try {
        if (user && !isAdmin) {
          const complaintsRef = collection(db, "complaints");
          const q = query(
            complaintsRef,
            where("studentId", "==", user.studentId || user.uid), // Students see their own complaints
            orderBy("createdAt", "desc")
          );

          const querySnapshot = await getDocs(q);
          const fetchedComplaints = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : null,
            updatedAt: doc.data().updatedAt?.toDate ? doc.data().updatedAt.toDate() : null,
          })) as Complaint[];

          setComplaints(fetchedComplaints);
        } else {
          setError("Unauthorized access. Redirecting...");
        }
      } catch (error) {
        console.error("Error fetching complaints:", error);
        setError("Failed to fetch complaints. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchComplaints();
  }, [user, isAdmin]);

  // Redirect admins to the admin dashboard
  if (isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  // Calculate statistics
  const totalComplaints = complaints.length;
  const resolvedComplaints = complaints.filter((c) => c.status === "resolved").length;
  const pendingComplaints = complaints.filter((c) => c.status === "pending").length;
  const rejectedComplaints = complaints.filter((c) => c.status === "rejected").length;
  const recentComplaints = complaints.slice(0, 5);

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Welcome section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="glass-card rounded-xl p-6 md:p-8"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">
                Welcome back, {user?.name?.split(" ")[0] || "User"}
              </h1>
              <p className="text-muted-foreground mt-1">
                Here's an overview of your complaints and their status
              </p>
            </div>
            <Button asChild>
              <Link to="/complaints/new">
                <PlusCircle className="h-4 w-4 mr-2" />
                New Complaint
              </Link>
            </Button>
          </div>
        </motion.div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatisticCard
            title="Total Complaints"
            value={totalComplaints}
            icon={FileText}
            index={0}
          />
          <StatisticCard
            title="Resolved"
            value={resolvedComplaints}
            description={`${Math.round((resolvedComplaints / totalComplaints) * 100) || 0}% of total`}
            icon={CheckCircle}
            index={1}
          />
          <StatisticCard
            title="Pending"
            value={pendingComplaints}
            icon={Clock}
            index={2}
          />
          <StatisticCard
            title="Rejected"
            value={rejectedComplaints}
            icon={AlertCircle}
            index={3}
          />
        </div>

        {/* Recent complaints */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Recent Complaints</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/complaints">
                View All
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-pulse flex flex-col w-full space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-muted rounded-lg h-24 w-full" />
                ))}
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600">{error}</p>
            </div>
          ) : recentComplaints.length > 0 ? (
            <div className="space-y-2">
              {recentComplaints.map((complaint, index) => (
                <ComplaintListItem
                  key={complaint.id}
                  complaint={complaint}
                  index={index}
                />
              ))}
            </div>
          ) : (
            <div className="glass-card rounded-lg p-8 text-center">
              <h3 className="text-lg font-medium mb-2">No complaints yet</h3>
              <p className="text-muted-foreground mb-4">
                You haven't submitted any complaints yet. Start by creating your first complaint.
              </p>
              <Button asChild>
                <Link to="/complaints/new">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  New Complaint
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;