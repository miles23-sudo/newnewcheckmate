import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, BookOpen, FileText, Video, Link, Upload, Eye } from "lucide-react";

// Material schema for form validation
const materialSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  courseId: z.string().min(1, "Course is required"),
  type: z.enum(['lesson', 'resource', 'video', 'document', 'link']),
  content: z.string().optional(),
  externalUrl: z.string().url().optional().or(z.literal("")),
  isPublished: z.boolean().default(false),
});

type MaterialFormData = z.infer<typeof materialSchema>;

interface MaterialFormProps {
  courses: Array<{ id: string; code: string; section: string; title: string }>;
  onMaterialCreated: (material: any) => void;
}

const materialTypes = [
  { value: 'lesson', label: 'Lesson', icon: BookOpen, description: 'Educational content and lessons' },
  { value: 'resource', label: 'Resource', icon: FileText, description: 'Reference materials and resources' },
  { value: 'video', label: 'Video', icon: Video, description: 'Video content or recordings' },
  { value: 'document', label: 'Document', icon: FileText, description: 'PDFs, Word docs, etc.' },
  { value: 'link', label: 'Link', icon: Link, description: 'External website or resource' },
];

export default function MaterialForm({ courses, onMaterialCreated }: MaterialFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<string>("");
  const { toast } = useToast();

  const form = useForm<MaterialFormData>({
    resolver: zodResolver(materialSchema),
    defaultValues: {
      title: "",
      description: "",
      courseId: "",
      type: "lesson",
      content: "",
      externalUrl: "",
      isPublished: false,
    },
  });

  const onSubmit = async (data: MaterialFormData) => {
    try {
      // Mock user ID - in real app, get from auth context
      const mockUserId = "1";
      
      const materialData = {
        ...data,
        createdBy: mockUserId,
        orderIndex: 0, // Default order
      };

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newMaterial = {
        id: Date.now().toString(),
        ...materialData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      onMaterialCreated(newMaterial);
      form.reset();
      setIsOpen(false);
      setSelectedType("");
      
      toast({
        title: "Material Created",
        description: "Your material has been created successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create material. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleTypeChange = (value: string) => {
    setSelectedType(value);
    form.setValue("type", value as any);
    
    // Clear content when switching types
    if (value === "link") {
      form.setValue("content", "");
    } else {
      form.setValue("externalUrl", "");
    }
  };

  const selectedTypeInfo = materialTypes.find(t => t.value === selectedType);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Material
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Add New Material
          </DialogTitle>
          <DialogDescription>
            Share lessons, resources, and materials with your students
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="courseId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a course" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {courses.map((course) => (
                          <SelectItem key={course.id} value={course.id}>
                            {course.code} - Section {course.section} - {course.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Material Type</FormLabel>
                    <Select onValueChange={handleTypeChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select material type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {materialTypes.map((type) => {
                          const Icon = type.icon;
                          return (
                            <SelectItem key={type.value} value={type.value}>
                              <div className="flex items-center gap-2">
                                <Icon className="h-4 w-4" />
                                <div>
                                  <div className="font-medium">{type.label}</div>
                                  <div className="text-xs text-muted-foreground">{type.description}</div>
                                </div>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {selectedTypeInfo && (
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                {React.createElement(selectedTypeInfo.icon, { className: "h-4 w-4 text-muted-foreground" })}
                <div className="text-sm text-muted-foreground">
                  {selectedTypeInfo.description}
                </div>
              </div>
            )}
            
            <FormField
              control={form.control}
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
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter material description..." 
                      className="min-h-[80px] resize-none"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedType === "link" ? (
              <FormField
                control={form.control}
                name="externalUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>External URL</FormLabel>
                    <FormControl>
                      <Input 
                        type="url"
                        placeholder="https://example.com" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : selectedType === "document" ? (
              <div className="space-y-4">
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-muted-foreground/50 transition-colors">
                  <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                  <div className="text-sm font-medium mb-1">Upload Document</div>
                  <div className="text-xs text-muted-foreground mb-4">
                    Drag and drop your file here, or click to browse
                  </div>
                  <Button variant="outline" size="sm" type="button">
                    <Upload className="mr-2 h-4 w-4" />
                    Choose File
                  </Button>
                </div>
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Add any additional notes or instructions for this document..."
                          className="min-h-[80px] resize-none"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            ) : (
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder={
                          selectedType === "lesson" 
                            ? "Enter lesson content..." 
                            : selectedType === "video"
                            ? "Video description or instructions..."
                            : selectedType === "resource"
                            ? "Enter resource content..."
                            : "Enter material content..."
                        }
                        className="min-h-[120px] resize-none"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <FormField
              control={form.control}
              name="isPublished"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      Publish Material
                    </FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Make this material visible to students
                    </div>
                  </div>
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      className="h-4 w-4"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Creating..." : "Create Material"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
