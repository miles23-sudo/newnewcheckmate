import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Megaphone, FolderOpen, Search, Edit, Trash2, Eye, Calendar, User, AlertCircle, BookOpen, FileText, Video, Link, Upload } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import AnnouncementForm from "@/components/AnnouncementForm";
import MaterialForm from "@/components/MaterialForm";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertAnnouncementSchema, insertMaterialSchema, type Announcement, type Material } from "@shared/schema";

// Mock user data - will be replaced with actual authentication
const mockInstructor = {
  id: "1",
  firstName: "Dr. Maria",
  lastName: "Martinez",
  email: "maria.martinez@ollc.edu",
  role: "instructor" as const,
};

// Edit schemas
const editAnnouncementSchema = insertAnnouncementSchema.partial().pick({
  title: true,
  content: true,
  isImportant: true,
});

const editMaterialSchema = insertMaterialSchema.partial().pick({
  title: true,
  description: true,
  type: true,
  content: true,
  externalUrl: true,
  isPublished: true,
});

type EditAnnouncementData = z.infer<typeof editAnnouncementSchema>;
type EditMaterialData = z.infer<typeof editMaterialSchema>;

// Mock courses for the forms
const courses = [
  { id: "cs201-a", code: "CS201", section: "A", title: "Data Structures and Algorithms" },
  { id: "cs201-b", code: "CS201", section: "B", title: "Data Structures and Algorithms" },
  { id: "cs401-a", code: "CS401", section: "A", title: "Machine Learning Fundamentals" },
  { id: "cs201-web", code: "CS201", section: "Web", title: "Web Development Fundamentals" },
  { id: "cs302-a", code: "CS302", section: "A", title: "Database Systems" },
];

// Mock data for announcements and materials
const mockAnnouncements = [
  {
    id: "1",
    title: "Midterm Exam Schedule",
    content: "The midterm exam for CS201 will be held on November 15th at 2:00 PM in Room 101. Please bring your student ID and a calculator.",
    courseId: "cs201-a",
    courseCode: "CS201 - Section A",
    courseTitle: "Data Structures and Algorithms",
    isImportant: true,
    createdBy: "1",
    createdAt: "2024-10-15T10:00:00Z",
    updatedAt: "2024-10-15T10:00:00Z",
  },
  {
    id: "2",
    title: "Assignment 3 Extension",
    content: "Due to the technical issues with the submission system, Assignment 3 deadline has been extended to November 20th.",
    courseId: "cs401-a",
    courseCode: "CS401 - Section A",
    courseTitle: "Machine Learning Fundamentals",
    isImportant: false,
    createdBy: "1",
    createdAt: "2024-10-12T14:30:00Z",
    updatedAt: "2024-10-12T14:30:00Z",
  },
  {
    id: "3",
    title: "Office Hours Update",
    content: "My office hours for this week have changed to Tuesday and Thursday 2-4 PM due to a conference.",
    courseId: "cs302-a",
    courseCode: "CS302 - Section A",
    courseTitle: "Database Systems",
    isImportant: false,
    createdBy: "1",
    createdAt: "2024-10-10T09:15:00Z",
    updatedAt: "2024-10-10T09:15:00Z",
  },
];

const mockMaterials = [
  {
    id: "1",
    title: "Introduction to Binary Trees",
    description: "Comprehensive guide to binary tree data structures and their operations",
    courseId: "cs201-a",
    courseCode: "CS201 - Section A",
    courseTitle: "Data Structures and Algorithms",
    type: "lesson",
    content: "Binary trees are hierarchical data structures where each node has at most two children...",
    isPublished: true,
    createdBy: "1",
    createdAt: "2024-10-14T11:00:00Z",
    updatedAt: "2024-10-14T11:00:00Z",
  },
  {
    id: "2",
    title: "Machine Learning Algorithms Reference",
    description: "Quick reference guide for common ML algorithms",
    courseId: "cs401-a",
    courseCode: "CS401 - Section A",
    courseTitle: "Machine Learning Fundamentals",
    type: "resource",
    content: "This resource covers supervised learning algorithms including linear regression, decision trees, and neural networks...",
    isPublished: true,
    createdBy: "1",
    createdAt: "2024-10-13T16:20:00Z",
    updatedAt: "2024-10-13T16:20:00Z",
  },
  {
    id: "3",
    title: "Database Design Best Practices",
    description: "Video tutorial on database normalization and design principles",
    courseId: "cs302-a",
    courseCode: "CS302 - Section A",
    courseTitle: "Database Systems",
    type: "video",
    content: "This video covers the fundamentals of database design including normalization forms and relationship modeling...",
    isPublished: false,
    createdBy: "1",
    createdAt: "2024-10-11T13:45:00Z",
    updatedAt: "2024-10-11T13:45:00Z",
  },
  {
    id: "4",
    title: "React Documentation",
    description: "Official React documentation for web development course",
    courseId: "cs201-web",
    courseCode: "CS201 - Section Web",
    courseTitle: "Web Development Fundamentals",
    type: "link",
    externalUrl: "https://react.dev/",
    isPublished: true,
    createdBy: "1",
    createdAt: "2024-10-09T08:30:00Z",
    updatedAt: "2024-10-09T08:30:00Z",
  },
];

const materialTypeIcons = {
  lesson: BookOpen,
  resource: FileText,
  video: Video,
  document: FileText,
  link: Link,
};

export default function InstructorContentManagement() {
  const [announcementSearch, setAnnouncementSearch] = useState("");
  const [materialSearch, setMaterialSearch] = useState("");
  const [announcementFilter, setAnnouncementFilter] = useState<"all" | "important" | "recent">("all");
  const [materialFilter, setMaterialFilter] = useState<"all" | "published" | "drafts">("all");
  
  // Edit and view states
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [viewingAnnouncement, setViewingAnnouncement] = useState<Announcement | null>(null);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [viewingMaterial, setViewingMaterial] = useState<Material | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Edit announcement form
  const editAnnouncementForm = useForm<EditAnnouncementData>({
    resolver: zodResolver(editAnnouncementSchema),
    defaultValues: {
      title: "",
      content: "",
      isImportant: false,
    },
  });

  // Edit material form
  const editMaterialForm = useForm<EditMaterialData>({
    resolver: zodResolver(editMaterialSchema),
    defaultValues: {
      title: "",
      description: "",
      type: "lesson",
      content: "",
      externalUrl: "",
      isPublished: false,
    },
  });

  // Fetch instructor's courses
  const { data: teachingCourses = [], isLoading: coursesLoading } = useQuery({
    queryKey: ['/api/courses/instructor', mockInstructor.id],
    queryFn: () => apiRequest(`/api/courses/instructor/${mockInstructor.id}`),
    enabled: true,
  });

  // Fetch all announcements for instructor's courses
  const { data: allAnnouncements = [], isLoading: announcementsLoading, error: announcementsError } = useQuery({
    queryKey: ['/api/announcements/instructor', mockInstructor.id],
    queryFn: async () => {
      const courseIds = teachingCourses.map(course => course.id);
      const announcements = [];
      for (const courseId of courseIds) {
        try {
          const courseAnnouncements = await apiRequest(`/api/announcements/course/${courseId}`);
          announcements.push(...courseAnnouncements);
        } catch (error) {
          console.error(`Failed to fetch announcements for course ${courseId}:`, error);
        }
      }
      return announcements;
    },
    enabled: teachingCourses.length > 0,
  });

  // Fetch all materials for instructor's courses
  const { data: allMaterials = [], isLoading: materialsLoading, error: materialsError } = useQuery({
    queryKey: ['/api/materials/instructor', mockInstructor.id],
    queryFn: async () => {
      const courseIds = teachingCourses.map(course => course.id);
      const materials = [];
      for (const courseId of courseIds) {
        try {
          const courseMaterials = await apiRequest(`/api/materials/course/${courseId}`);
          materials.push(...courseMaterials);
        } catch (error) {
          console.error(`Failed to fetch materials for course ${courseId}:`, error);
        }
      }
      return materials;
    },
    enabled: teachingCourses.length > 0,
  });

  // Mutations for announcements
  const updateAnnouncementMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: EditAnnouncementData }) => {
      return apiRequest(`/api/announcements/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({ title: "Announcement updated successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/announcements'] });
      setEditingAnnouncement(null);
    },
    onError: () => {
      toast({ title: "Failed to update announcement", variant: "destructive" });
    },
  });

  const deleteAnnouncementMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/announcements/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      toast({ title: "Announcement deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/announcements'] });
    },
    onError: () => {
      toast({ title: "Failed to delete announcement", variant: "destructive" });
    },
  });

  // Mutations for materials
  const updateMaterialMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: EditMaterialData }) => {
      return apiRequest(`/api/materials/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({ title: "Material updated successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/materials'] });
      setEditingMaterial(null);
    },
    onError: () => {
      toast({ title: "Failed to update material", variant: "destructive" });
    },
  });

  const deleteMaterialMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/materials/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      toast({ title: "Material deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/materials'] });
    },
    onError: () => {
      toast({ title: "Failed to delete material", variant: "destructive" });
    },
  });

  const handleAnnouncementCreated = (announcement: any) => {
    queryClient.invalidateQueries({ queryKey: ['/api/announcements/instructor', mockInstructor.id] });
  };

  const handleMaterialCreated = (material: any) => {
    queryClient.invalidateQueries({ queryKey: ['/api/materials/instructor', mockInstructor.id] });
  };

  const handleDeleteAnnouncement = (id: string) => {
    if (confirm("Are you sure you want to delete this announcement? This action cannot be undone.")) {
      deleteAnnouncementMutation.mutate(id);
    }
  };

  const handleDeleteMaterial = (id: string) => {
    if (confirm("Are you sure you want to delete this material? This action cannot be undone.")) {
      deleteMaterialMutation.mutate(id);
    }
  };

  // Edit handlers
  const handleEditAnnouncement = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    editAnnouncementForm.reset({
      title: announcement.title,
      content: announcement.content,
      isImportant: announcement.isImportant,
    });
  };

  const handleEditMaterial = (material: Material) => {
    setEditingMaterial(material);
    editMaterialForm.reset({
      title: material.title,
      description: material.description || "",
      type: material.type,
      content: material.content || "",
      externalUrl: material.externalUrl || "",
      isPublished: material.isPublished,
    });
  };

  // View handlers
  const handleViewAnnouncement = (announcement: Announcement) => {
    setViewingAnnouncement(announcement);
  };

  const handleViewMaterial = (material: Material) => {
    setViewingMaterial(material);
  };

  // Form submission handlers
  const onSubmitEditAnnouncement = (data: EditAnnouncementData) => {
    if (editingAnnouncement) {
      updateAnnouncementMutation.mutate({ id: editingAnnouncement.id, data });
    }
  };

  const onSubmitEditMaterial = (data: EditMaterialData) => {
    if (editingMaterial) {
      updateMaterialMutation.mutate({ id: editingMaterial.id, data });
    }
  };

  const handleToggleAnnouncementImportant = (announcement: Announcement) => {
    updateAnnouncementMutation.mutate({ 
      id: announcement.id, 
      data: { isImportant: !announcement.isImportant } 
    });
  };

  const handleToggleMaterialPublished = (material: Material) => {
    updateMaterialMutation.mutate({ 
      id: material.id, 
      data: { isPublished: !material.isPublished } 
    });
  };

  // Filter announcements
  const filteredAnnouncements = allAnnouncements.filter(announcement => {
    const course = teachingCourses.find(c => c.id === announcement.courseId);
    const courseCode = course ? `${course.code} - Section ${course.section}` : '';
    
    const matchesSearch = announcement.title.toLowerCase().includes(announcementSearch.toLowerCase()) ||
                         announcement.content.toLowerCase().includes(announcementSearch.toLowerCase()) ||
                         courseCode.toLowerCase().includes(announcementSearch.toLowerCase());
    
    const matchesFilter = announcementFilter === "all" || 
                         (announcementFilter === "important" && announcement.isImportant) ||
                         (announcementFilter === "recent" && new Date(announcement.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
    
    return matchesSearch && matchesFilter;
  });

  // Filter materials
  const filteredMaterials = allMaterials.filter(material => {
    const course = teachingCourses.find(c => c.id === material.courseId);
    const courseCode = course ? `${course.code} - Section ${course.section}` : '';
    
    const matchesSearch = material.title.toLowerCase().includes(materialSearch.toLowerCase()) ||
                         (material.description && material.description.toLowerCase().includes(materialSearch.toLowerCase())) ||
                         courseCode.toLowerCase().includes(materialSearch.toLowerCase());
    
    const matchesFilter = materialFilter === "all" || 
                         (materialFilter === "published" && material.isPublished) ||
                         (materialFilter === "drafts" && !material.isPublished);
    
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="flex h-16 items-center px-4">
          <div className="flex items-center space-x-2">
            <Megaphone className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-xl font-bold">Content Management</h1>
              <p className="text-sm text-muted-foreground">Manage announcements and course materials</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <Tabs defaultValue="announcements" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="announcements" className="flex items-center gap-2">
              <Megaphone className="h-4 w-4" />
              Announcements
            </TabsTrigger>
            <TabsTrigger value="materials" className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4" />
              Materials
            </TabsTrigger>
          </TabsList>

          <TabsContent value="announcements" className="space-y-6">
            {/* Announcements Header */}
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Announcements</h2>
                <p className="text-muted-foreground">Share important updates with your students</p>
              </div>
              <AnnouncementForm 
                courses={courses}
                onAnnouncementCreated={handleAnnouncementCreated}
              />
            </div>

            {/* Announcements Statistics */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Announcements</CardTitle>
                  <Megaphone className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{allAnnouncements.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {allAnnouncements.filter(a => a.isImportant).length} important
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">This Week</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {allAnnouncements.filter(a => new Date(a.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length}
                  </div>
                  <p className="text-xs text-muted-foreground">Recent announcements</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Important</CardTitle>
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {allAnnouncements.filter(a => a.isImportant).length}
                  </div>
                  <p className="text-xs text-muted-foreground">High priority</p>
                </CardContent>
              </Card>
            </div>

            {/* Search and Filter */}
            <div className="flex gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search announcements..." 
                  className="pl-10"
                  value={announcementSearch}
                  onChange={(e) => setAnnouncementSearch(e.target.value)}
                />
              </div>
              <Button 
                variant={announcementFilter === "all" ? "default" : "outline"} 
                size="sm"
                onClick={() => setAnnouncementFilter("all")}
              >
                All
              </Button>
              <Button 
                variant={announcementFilter === "important" ? "default" : "outline"} 
                size="sm"
                onClick={() => setAnnouncementFilter("important")}
              >
                Important
              </Button>
              <Button 
                variant={announcementFilter === "recent" ? "default" : "outline"} 
                size="sm"
                onClick={() => setAnnouncementFilter("recent")}
              >
                Recent
              </Button>
            </div>

            {/* Announcements List */}
            <div className="space-y-4">
              {announcementsError ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
                    <h3 className="text-lg font-semibold mb-2 text-red-600">Error Loading Announcements</h3>
                    <p className="text-muted-foreground mb-4">
                      There was an error loading announcements. Please try again later.
                    </p>
                    <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/announcements/instructor', mockInstructor.id] })}>
                      Retry
                    </Button>
                  </CardContent>
                </Card>
              ) : announcementsLoading ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading announcements...</p>
                  </CardContent>
                </Card>
              ) : filteredAnnouncements.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Megaphone className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No announcements found</h3>
                    <p className="text-muted-foreground mb-4">
                      {announcementSearch || announcementFilter !== "all" 
                        ? "Try adjusting your search or filter criteria."
                        : "You haven't posted any announcements yet. Start by creating your first announcement."
                      }
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filteredAnnouncements.map((announcement) => (
                  <Card key={announcement.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold">{announcement.title}</h3>
                            {announcement.isImportant && (
                              <Badge variant="destructive" className="text-xs">
                                <AlertCircle className="mr-1 h-3 w-3" />
                                Important
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {(() => {
                              const course = teachingCourses.find(c => c.id === announcement.courseId);
                              return course ? `${course.code} - Section ${course.section} • ${course.title}` : 'Unknown Course';
                            })()}
                          </p>
                          <p className="text-sm">{announcement.content}</p>
                          
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span>{new Date(announcement.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <User className="h-4 w-4" />
                              <span>Dr. Maria Martinez</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex gap-2 ml-4">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleToggleAnnouncementImportant(announcement)}
                          >
                            {announcement.isImportant ? "Mark Normal" : "Mark Important"}
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEditAnnouncement(announcement)}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleViewAnnouncement(announcement)}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleDeleteAnnouncement(announcement.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="materials" className="space-y-6">
            {/* Materials Header */}
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Course Materials</h2>
                <p className="text-muted-foreground">Share lessons, resources, and materials with your students</p>
              </div>
              <MaterialForm 
                courses={courses}
                onMaterialCreated={handleMaterialCreated}
              />
            </div>

            {/* Materials Statistics */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Materials</CardTitle>
                  <FolderOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{allMaterials.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {allMaterials.filter(m => m.isPublished).length} published
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Lessons</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {allMaterials.filter(m => m.type === 'lesson').length}
                  </div>
                  <p className="text-xs text-muted-foreground">Educational content</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Resources</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {allMaterials.filter(m => m.type === 'resource').length}
                  </div>
                  <p className="text-xs text-muted-foreground">Reference materials</p>
                </CardContent>
              </Card>
              
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Drafts</CardTitle>
                  <Edit className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {allMaterials.filter(m => !m.isPublished).length}
                  </div>
                  <p className="text-xs text-muted-foreground">Unpublished</p>
                </CardContent>
              </Card>
            </div>

            {/* Search and Filter */}
            <div className="flex gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search materials..." 
                  className="pl-10"
                  value={materialSearch}
                  onChange={(e) => setMaterialSearch(e.target.value)}
                />
              </div>
              <Button 
                variant={materialFilter === "all" ? "default" : "outline"} 
                size="sm"
                onClick={() => setMaterialFilter("all")}
              >
                All
              </Button>
              <Button 
                variant={materialFilter === "published" ? "default" : "outline"} 
                size="sm"
                onClick={() => setMaterialFilter("published")}
              >
                Published
              </Button>
              <Button 
                variant={materialFilter === "drafts" ? "default" : "outline"} 
                size="sm"
                onClick={() => setMaterialFilter("drafts")}
              >
                Drafts
              </Button>
            </div>

            {/* Materials List */}
            <div className="space-y-4">
              {materialsError ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
                    <h3 className="text-lg font-semibold mb-2 text-red-600">Error Loading Materials</h3>
                    <p className="text-muted-foreground mb-4">
                      There was an error loading materials. Please try again later.
                    </p>
                    <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/materials/instructor', mockInstructor.id] })}>
                      Retry
                    </Button>
                  </CardContent>
                </Card>
              ) : materialsLoading ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading materials...</p>
                  </CardContent>
                </Card>
              ) : filteredMaterials.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <FolderOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No materials found</h3>
                    <p className="text-muted-foreground mb-4">
                      {materialSearch || materialFilter !== "all" 
                        ? "Try adjusting your search or filter criteria."
                        : "You haven't created any materials yet. Start by adding your first material."
                      }
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filteredMaterials.map((material) => {
                  const TypeIcon = materialTypeIcons[material.type as keyof typeof materialTypeIcons] || FileText;
                  return (
                    <Card key={material.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2">
                              <TypeIcon className="h-5 w-5 text-muted-foreground" />
                              <h3 className="text-lg font-semibold">{material.title}</h3>
                              <Badge variant="outline" className="text-xs">
                                {material.type}
                              </Badge>
                              {material.isPublished ? (
                                <Badge variant="default" className="text-xs">Published</Badge>
                              ) : (
                                <Badge variant="secondary" className="text-xs">Draft</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {(() => {
                                const course = teachingCourses.find(c => c.id === material.courseId);
                                return course ? `${course.code} - Section ${course.section} • ${course.title}` : 'Unknown Course';
                              })()}
                            </p>
                            {material.description && (
                              <p className="text-sm">{material.description}</p>
                            )}
                            
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                <span>{new Date(material.createdAt).toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <User className="h-4 w-4" />
                                <span>Dr. Maria Martinez</span>
                              </div>
                              {material.type === 'link' && material.externalUrl && (
                                <div className="flex items-center gap-1">
                                  <Link className="h-4 w-4" />
                                  <a 
                                    href={material.externalUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline"
                                  >
                                    View Link
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex gap-2 ml-4">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleToggleMaterialPublished(material)}
                            >
                              {material.isPublished ? "Unpublish" : "Publish"}
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleEditMaterial(material)}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleViewMaterial(material)}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-red-600 hover:text-red-700"
                              onClick={() => handleDeleteMaterial(material.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Announcement Dialog */}
      <Dialog open={!!editingAnnouncement} onOpenChange={() => setEditingAnnouncement(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Announcement</DialogTitle>
            <DialogDescription>
              Update the announcement details below.
            </DialogDescription>
          </DialogHeader>
          <Form {...editAnnouncementForm}>
            <form onSubmit={editAnnouncementForm.handleSubmit(onSubmitEditAnnouncement)} className="space-y-4">
              <FormField
                control={editAnnouncementForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter announcement title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editAnnouncementForm.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter announcement content" 
                        className="min-h-[120px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editAnnouncementForm.control}
                name="isImportant"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="rounded border-gray-300"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Mark as Important</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditingAnnouncement(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateAnnouncementMutation.isPending}>
                  {updateAnnouncementMutation.isPending ? "Updating..." : "Update Announcement"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* View Announcement Dialog */}
      <Dialog open={!!viewingAnnouncement} onOpenChange={() => setViewingAnnouncement(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{viewingAnnouncement?.title}</DialogTitle>
            <DialogDescription>
              {(() => {
                if (!viewingAnnouncement) return '';
                const course = teachingCourses.find(c => c.id === viewingAnnouncement.courseId);
                return course ? `${course.code} - Section ${course.section} • ${course.title}` : 'Unknown Course';
              })()}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              {viewingAnnouncement?.isImportant && (
                <Badge variant="destructive" className="text-xs">
                  <AlertCircle className="mr-1 h-3 w-3" />
                  Important
                </Badge>
              )}
              <span className="text-sm text-muted-foreground">
                Created: {viewingAnnouncement?.createdAt ? new Date(viewingAnnouncement.createdAt).toLocaleDateString() : ''}
              </span>
            </div>
            <div className="prose max-w-none">
              <p className="whitespace-pre-wrap">{viewingAnnouncement?.content}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewingAnnouncement(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Material Dialog */}
      <Dialog open={!!editingMaterial} onOpenChange={() => setEditingMaterial(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Material</DialogTitle>
            <DialogDescription>
              Update the material details below.
            </DialogDescription>
          </DialogHeader>
          <Form {...editMaterialForm}>
            <form onSubmit={editMaterialForm.handleSubmit(onSubmitEditMaterial)} className="space-y-4">
              <FormField
                control={editMaterialForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter material title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editMaterialForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter material description" 
                        className="min-h-[80px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editMaterialForm.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select material type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="lesson">Lesson</SelectItem>
                        <SelectItem value="resource">Resource</SelectItem>
                        <SelectItem value="video">Video</SelectItem>
                        <SelectItem value="document">Document</SelectItem>
                        <SelectItem value="link">Link</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {editMaterialForm.watch("type") === "link" && (
                <FormField
                  control={editMaterialForm.control}
                  name="externalUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>External URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              {editMaterialForm.watch("type") !== "link" && (
                <FormField
                  control={editMaterialForm.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Content</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter material content" 
                          className="min-h-[120px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <FormField
                control={editMaterialForm.control}
                name="isPublished"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="rounded border-gray-300"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Published</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditingMaterial(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateMaterialMutation.isPending}>
                  {updateMaterialMutation.isPending ? "Updating..." : "Update Material"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* View Material Dialog */}
      <Dialog open={!!viewingMaterial} onOpenChange={() => setViewingMaterial(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {viewingMaterial && (() => {
                const TypeIcon = materialTypeIcons[viewingMaterial.type as keyof typeof materialTypeIcons] || FileText;
                return <TypeIcon className="h-5 w-5" />;
              })()}
              {viewingMaterial?.title}
            </DialogTitle>
            <DialogDescription>
              {(() => {
                if (!viewingMaterial) return '';
                const course = teachingCourses.find(c => c.id === viewingMaterial.courseId);
                return course ? `${course.code} - Section ${course.section} • ${course.title}` : 'Unknown Course';
              })()}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {viewingMaterial?.type}
              </Badge>
              {viewingMaterial?.isPublished ? (
                <Badge variant="default" className="text-xs">Published</Badge>
              ) : (
                <Badge variant="secondary" className="text-xs">Draft</Badge>
              )}
              <span className="text-sm text-muted-foreground">
                Created: {viewingMaterial?.createdAt ? new Date(viewingMaterial.createdAt).toLocaleDateString() : ''}
              </span>
            </div>
            {viewingMaterial?.description && (
              <div>
                <h4 className="font-medium mb-2">Description</h4>
                <p className="text-sm text-muted-foreground">{viewingMaterial.description}</p>
              </div>
            )}
            {viewingMaterial?.type === 'link' && viewingMaterial?.externalUrl && (
              <div>
                <h4 className="font-medium mb-2">External Link</h4>
                <a 
                  href={viewingMaterial.externalUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {viewingMaterial.externalUrl}
                </a>
              </div>
            )}
            {viewingMaterial?.content && viewingMaterial?.type !== 'link' && (
              <div>
                <h4 className="font-medium mb-2">Content</h4>
                <div className="prose max-w-none">
                  <p className="whitespace-pre-wrap">{viewingMaterial.content}</p>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewingMaterial(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
