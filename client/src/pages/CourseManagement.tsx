import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, Users, Plus, Settings, Trash2, Edit, FileText, Brain } from "lucide-react";
import { insertCourseSchema, type Course, type InsertCourse } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useUser } from "@/contexts/UserContext";

export default function CourseManagement() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [managingCourse, setManagingCourse] = useState<Course | null>(null);
  const { toast } = useToast();
  const { user } = useUser();

  // If user is not loaded yet, show loading
  if (!user) {
    return <div>Loading...</div>;
  }


  // Create course form
  const createForm = useForm<InsertCourse>({
    resolver: zodResolver(insertCourseSchema),
    defaultValues: {
      title: "",
      description: "",
      code: "",
      section: "A",
      instructorId: user.id,
    },
  });

  // Edit course form
  const editForm = useForm<Partial<Course>>({
    resolver: zodResolver(insertCourseSchema.partial()),
    defaultValues: {
      title: "",
      description: "",
      code: "",
      section: "",
    },
  });

  // Fetch instructor's courses
  const { data: courses = [], isLoading } = useQuery({
    queryKey: ['/api/courses/instructor', user.id],
    queryFn: () => fetch(`/api/courses/instructor/${user.id}`, { credentials: 'include' }).then(r => r.json()),
  });

  // Mock enrollment data
  const { data: enrollmentData = {} } = useQuery({
    queryKey: ['/api/courses/enrollments'],
    enabled: false,
    initialData: {} as Record<string, number>,
  });

  // Create course mutation
  const createCourseMutation = useMutation({
    mutationFn: async (courseData: InsertCourse) => {
      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(courseData),
      });
      if (!response.ok) {
        throw new Error('Failed to create course');
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/courses/instructor'] });
      setIsCreateDialogOpen(false);
      createForm.reset();
      toast({
        title: "Course Created",
        description: "Your new course has been created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create course. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update course mutation
  const updateCourseMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Course> & { id: string }) => {
      const response = await fetch(`/api/courses/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updates),
      });
      if (!response.ok) {
        throw new Error('Failed to update course');
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/courses/instructor'] });
      setEditingCourse(null);
      editForm.reset();
      toast({
        title: "Course Updated",
        description: "Course has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update course. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete course mutation
  const deleteCourseMutation = useMutation({
    mutationFn: async (courseId: string) => {
      const response = await fetch(`/api/courses/${courseId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to delete course');
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/courses/instructor'] });
      toast({
        title: "Course Deleted",
        description: "Course has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete course. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCreateCourse = (data: InsertCourse) => {
    createCourseMutation.mutate(data);
  };

  const handleEditCourse = (data: Partial<Course>) => {
    if (editingCourse) {
      updateCourseMutation.mutate({ id: editingCourse.id, ...data });
    }
  };

  const handleDeleteCourse = (courseId: string) => {
    if (confirm("Are you sure you want to delete this course? This action cannot be undone.")) {
      deleteCourseMutation.mutate(courseId);
    }
  };

  const openEditDialog = (course: Course) => {
    setEditingCourse(course);
    editForm.reset({
      title: course.title,
      description: course.description || "",
      code: course.code,
      section: course.section,
    });
  };

  const openManageDialog = (course: Course) => {
    setManagingCourse(course);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-muted-foreground">Loading courses...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold" data-testid="heading-course-management">Course Management</h1>
          <p className="text-muted-foreground">Create and manage your courses</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-course">
              <Plus className="mr-2 h-4 w-4" />
              Create Course
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Course</DialogTitle>
              <DialogDescription>
                Add a new course to your teaching portfolio
              </DialogDescription>
            </DialogHeader>
            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit(handleCreateCourse)} className="space-y-4">
                <FormField
                  control={createForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Course Title</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Introduction to Computer Science" 
                          data-testid="input-course-title"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Course Code</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="CS101" 
                          data-testid="input-course-code"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="section"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Section</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="A" 
                          data-testid="input-course-section"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Course description and objectives..." 
                          data-testid="input-course-description"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsCreateDialogOpen(false)}
                    data-testid="button-cancel-create"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createCourseMutation.isPending}
                    data-testid="button-submit-create"
                  >
                    {createCourseMutation.isPending ? "Creating..." : "Create Course"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Course Statistics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-courses">{courses.length}</div>
            <p className="text-xs text-muted-foreground">
              {courses.filter((c: Course) => c.isActive).length} active
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-students">
              {Object.values(enrollmentData).reduce((sum: number, count: any) => sum + count, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all courses
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Courses</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-active-courses">
              {courses.filter((c: Course) => c.isActive).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently running
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Course List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {courses.map((course: Course) => (
          <Card key={course.id} className="hover-elevate">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <CardTitle className="text-lg" data-testid={`text-course-title-${course.id}`}>
                    {course.title}
                  </CardTitle>
                  <CardDescription>{course.code} - Section {course.section}</CardDescription>
                </div>
                <Badge variant={course.isActive ? "default" : "secondary"}>
                  {course.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {course.description}
                </p>
                
                <div className="flex justify-between text-sm">
                  <span>Students:</span>
                  <span className="font-medium" data-testid={`text-enrollment-${course.id}`}>
                    {enrollmentData[course.id] || 0}
                  </span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span>Created:</span>
                  <span className="text-muted-foreground">
                    {new Date(course.createdAt).toLocaleDateString()}
                  </span>
                </div>
                
                <div className="flex gap-2 pt-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => openEditDialog(course)}
                    data-testid={`button-edit-${course.id}`}
                  >
                    <Edit className="mr-1 h-3 w-3" />
                    Edit
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => {
                      console.log('Manage button clicked for course:', course.id);
                      alert('Manage button clicked!'); // Temporary debug
                      openManageDialog(course);
                    }}
                    data-testid={`button-manage-${course.id}`}
                  >
                    <Settings className="mr-1 h-3 w-3" />
                    Manage
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={() => handleDeleteCourse(course.id)}
                    data-testid={`button-delete-${course.id}`}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Course Dialog */}
      <Dialog open={!!editingCourse} onOpenChange={(open) => !open && setEditingCourse(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Course</DialogTitle>
            <DialogDescription>
              Update course information
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleEditCourse)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course Title</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Introduction to Computer Science" 
                        data-testid="input-edit-course-title"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course Code</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="CS101" 
                        data-testid="input-edit-course-code"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="section"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Section</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="A" 
                        data-testid="input-edit-course-section"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Course description and objectives..." 
                        data-testid="input-edit-course-description"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setEditingCourse(null)}
                  data-testid="button-cancel-edit"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateCourseMutation.isPending}
                  data-testid="button-submit-edit"
                >
                  {updateCourseMutation.isPending ? "Updating..." : "Update Course"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Manage Course Dialog */}
      <Dialog open={!!managingCourse} onOpenChange={(open) => {
        console.log('Dialog onOpenChange called:', {
          open,
          managingCourse: managingCourse,
          managingCourseExists: !!managingCourse,
          managingCourseId: managingCourse?.id,
          managingCourseTitle: managingCourse?.title
        });
        if (!open) {
          console.log('Closing dialog, setting managingCourse to null');
          setManagingCourse(null);
        }
      }}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Manage Course: {managingCourse?.title}</DialogTitle>
            <DialogDescription>
              Course code: {managingCourse?.code} | Status: {managingCourse?.isActive ? 'Active' : 'Inactive'}
            </DialogDescription>
          </DialogHeader>
          
          {managingCourse ? (
            <div className="space-y-6">
              {/* Debug info in dialog */}
              <div className="p-4 bg-blue-100 border border-blue-300 rounded">
                <p className="text-blue-800 font-semibold">Dialog Debug Info:</p>
                <div className="text-sm text-blue-700 mt-2">
                  <p>Course ID: {managingCourse.id}</p>
                  <p>Course Title: {managingCourse.title}</p>
                  <p>Course Code: {managingCourse.code}</p>
                  <p>Is Active: {managingCourse.isActive ? 'Yes' : 'No'}</p>
                </div>
                <Button 
                  onClick={() => {
                    console.log('Close button clicked, setting managingCourse to null');
                    setManagingCourse(null);
                  }}
                  className="mt-2"
                >
                  Close Dialog
                </Button>
              </div>
              
              {/* Course Overview */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Course Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <Label className="text-sm font-medium">Title</Label>
                      <p className="text-sm text-muted-foreground">{managingCourse.title}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Code</Label>
                      <p className="text-sm text-muted-foreground">{managingCourse.code}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Description</Label>
                      <p className="text-sm text-muted-foreground">{managingCourse.description}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Created</Label>
                      <p className="text-sm text-muted-foreground">{managingCourse.createdAt ? new Date(managingCourse.createdAt).toLocaleDateString() : 'N/A'}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Statistics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Enrolled Students:</span>
                      <span className="text-sm text-muted-foreground">{enrollmentData[managingCourse.id] || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Status:</span>
                      <Badge variant={managingCourse.isActive ? "default" : "secondary"}>
                        {managingCourse.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Last Updated:</span>
                      <span className="text-sm text-muted-foreground">{managingCourse.updatedAt ? new Date(managingCourse.updatedAt).toLocaleDateString() : 'N/A'}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Management Actions */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Course Management</h3>
                <div className="grid gap-2 md:grid-cols-2">
                  <Button 
                    variant="outline" 
                    className="justify-start"
                    onClick={() => {
                      console.log('Edit button clicked, managingCourse:', managingCourse);
                      if (managingCourse) {
                        setManagingCourse(null);
                        openEditDialog(managingCourse);
                      } else {
                        console.error('managingCourse is null when trying to edit');
                        toast({
                          title: "Error",
                          description: "Course data is not available for editing.",
                          variant: "destructive"
                        });
                      }
                    }}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Course Details
                  </Button>
                  <Button 
                    variant="outline" 
                    className="justify-start"
                    onClick={() => {
                      toast({
                        title: "Feature Coming Soon",
                        description: "This feature will be available soon.",
                      });
                    }}
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Manage Students
                  </Button>
                  <Button 
                    variant="outline" 
                    className="justify-start"
                    onClick={() => {
                      toast({
                        title: "Feature Coming Soon",
                        description: "Assignment management interface will be available soon.",
                      });
                    }}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Manage Assignments
                  </Button>
                  <Button 
                    variant="outline" 
                    className="justify-start"
                    onClick={() => {
                      toast({
                        title: "Feature Coming Soon",
                        description: "Grade management interface will be available soon.",
                      });
                    }}
                  >
                    <Brain className="mr-2 h-4 w-4" />
                    View Grades
                  </Button>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => setManagingCourse(null)}
                >
                  Close
                </Button>
                <Button 
                  variant="destructive"
                  onClick={() => {
                    console.log('Delete button clicked, managingCourse:', managingCourse);
                    if (managingCourse) {
                      setManagingCourse(null);
                      handleDeleteCourse(managingCourse.id);
                    } else {
                      console.error('managingCourse is null when trying to delete');
                      toast({
                        title: "Error",
                        description: "Course data is not available for deletion.",
                        variant: "destructive"
                      });
                    }
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Course
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}