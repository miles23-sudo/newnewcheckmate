import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, MoreVertical, Send, FileText, Calendar, Users, Settings, BookOpen, Plus, MessageSquare, Bell } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

// Mock course data
const mockCourse = {
  id: "cs101",
  code: "CS101",
  title: "Introduction to Computer Science",
  instructor: "Dr. Maria Martinez",
  year: "Y2",
  description: "Fundamental concepts of computer science and programming",
  color: "bg-blue-600"
};

// Mock announcements/posts
const mockPosts = [
  {
    id: "1",
    author: "Dr. Maria Martinez",
    authorInitials: "MM",
    date: "15 Nov 2024",
    content: "Assignment 3: Data Structures Implementation",
    type: "assignment",
    attachments: [
      {
        id: "1",
        title: "Assignment 3 - Data Structures.pdf",
        type: "PDF",
        thumbnail: "📄"
      }
    ],
    comments: [
      {
        id: "1",
        author: "Sarah Johnson",
        authorInitials: "SJ",
        content: "When is this due?",
        timestamp: "2 hours ago"
      },
      {
        id: "2",
        author: "Dr. Maria Martinez",
        authorInitials: "MM",
        content: "Due next Friday at 11:59 PM",
        timestamp: "1 hour ago"
      }
    ]
  },
  {
    id: "2",
    author: "Dr. Maria Martinez",
    authorInitials: "MM",
    date: "14 Nov 2024",
    content: "Reminder: Midterm exam is scheduled for next Monday. Please review chapters 1-5.",
    type: "announcement",
    attachments: [],
    comments: []
  },
  {
    id: "3",
    author: "Dr. Maria Martinez",
    authorInitials: "MM",
    date: "13 Nov 2024",
    content: "Lecture slides for this week are now available",
    type: "material",
    attachments: [
      {
        id: "2",
        title: "Week 8 - Object-Oriented Programming.pptx",
        type: "PowerPoint",
        thumbnail: "📊"
      }
    ],
    comments: []
  }
];

// Mock upcoming items
const mockUpcoming = [
  {
    id: "1",
    title: "Assignment 3: Data Structures",
    dueDate: "Nov 22, 2024",
    type: "assignment",
    course: "CS101"
  },
  {
    id: "2",
    title: "Midterm Exam",
    dueDate: "Nov 25, 2024",
    type: "exam",
    course: "CS101"
  }
];

export default function CourseStream() {
  const [, setLocation] = useLocation();
  const [selectedTab, setSelectedTab] = useState<'stream' | 'classwork' | 'people'>('stream');
  const [announcementText, setAnnouncementText] = useState("");
  const [commentText, setCommentText] = useState("");
  const [activeCommentPost, setActiveCommentPost] = useState<string | null>(null);

  const handleBackToDashboard = () => {
    setLocation('/student-dashboard');
  };

  const handleSendAnnouncement = () => {
    if (announcementText.trim()) {
      // Handle sending announcement
      console.log("Sending announcement:", announcementText);
      setAnnouncementText("");
    }
  };

  const handleSendComment = (postId: string) => {
    if (commentText.trim()) {
      // Handle sending comment
      console.log("Sending comment to post:", postId, commentText);
      setCommentText("");
      setActiveCommentPost(null);
    }
  };

  const renderStream = () => (
    <div className="space-y-6">
      {/* Announcement Input */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-purple-600 text-white">SJ</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Input
                placeholder="Announce something to your class"
                value={announcementText}
                onChange={(e) => setAnnouncementText(e.target.value)}
                className="border-0 focus-visible:ring-0 text-base"
              />
            </div>
            <Button 
              onClick={handleSendAnnouncement}
              disabled={!announcementText.trim()}
              size="sm"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Posts */}
      {mockPosts.map((post) => (
        <Card key={post.id}>
          <CardContent className="p-4">
            <div className="space-y-4">
              {/* Post Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-blue-600 text-white">
                      {post.authorInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium">{post.author}</h3>
                    <p className="text-sm text-muted-foreground">{post.date}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>

              {/* Post Content */}
              <div>
                <p className="text-base">{post.content}</p>
              </div>

              {/* Attachments */}
              {post.attachments.length > 0 && (
                <div className="space-y-2">
                  {post.attachments.map((attachment) => (
                    <div key={attachment.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                      <div className="text-2xl">{attachment.thumbnail}</div>
                      <div className="flex-1">
                        <p className="font-medium">{attachment.title}</p>
                        <p className="text-sm text-muted-foreground">{attachment.type}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Comments */}
              {post.comments.length > 0 && (
                <div className="space-y-3">
                  <Separator />
                  {post.comments.map((comment) => (
                    <div key={comment.id} className="flex items-start space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-gray-500 text-white text-xs">
                          {comment.authorInitials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-sm">{comment.author}</span>
                          <span className="text-xs text-muted-foreground">{comment.timestamp}</span>
                        </div>
                        <p className="text-sm mt-1">{comment.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Comment Input */}
              <div className="flex items-center space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-gray-500 text-white text-xs">SJ</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Input
                    placeholder="Add class comment..."
                    value={activeCommentPost === post.id ? commentText : ""}
                    onChange={(e) => setCommentText(e.target.value)}
                    onFocus={() => setActiveCommentPost(post.id)}
                    className="border-0 focus-visible:ring-0"
                  />
                </div>
                {activeCommentPost === post.id && (
                  <Button 
                    onClick={() => handleSendComment(post.id)}
                    disabled={!commentText.trim()}
                    size="sm"
                    variant="ghost"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderClasswork = () => (
    <div className="space-y-6">
      <div className="text-center py-12">
        <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium">Classwork</h3>
        <p className="text-muted-foreground">Assignments and materials will appear here</p>
      </div>
    </div>
  );

  const renderPeople = () => (
    <div className="space-y-6">
      <div className="text-center py-12">
        <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium">People</h3>
        <p className="text-muted-foreground">Class roster will appear here</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="flex h-16 items-center px-4">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={handleBackToDashboard}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-xl text-blue-600 dark:text-blue-400">CHECKmate</span>
          </div>
          <div className="ml-auto flex items-center space-x-2">
            <Button variant="ghost" size="sm">
              <Bell className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="sm">
              <MessageSquare className="h-5 w-5" />
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* Course Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">{mockCourse.code}</h1>
              <h2 className="text-xl opacity-90">{mockCourse.title}</h2>
              <p className="text-sm opacity-75 mt-1">{mockCourse.instructor}</p>
            </div>
            <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
              <Settings className="h-4 w-4 mr-2" />
              View class information
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        <div className="flex gap-6">
          {/* Main Content */}
          <div className="flex-1">
            {/* Navigation Tabs */}
            <div className="flex space-x-8 border-b mb-6">
              <button
                onClick={() => setSelectedTab('stream')}
                className={`pb-2 text-sm font-medium ${
                  selectedTab === 'stream'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Stream
              </button>
              <button
                onClick={() => setSelectedTab('classwork')}
                className={`pb-2 text-sm font-medium ${
                  selectedTab === 'classwork'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Classwork
              </button>
              <button
                onClick={() => setSelectedTab('people')}
                className={`pb-2 text-sm font-medium ${
                  selectedTab === 'people'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                People
              </button>
            </div>

            {/* Tab Content */}
            {selectedTab === 'stream' && renderStream()}
            {selectedTab === 'classwork' && renderClasswork()}
            {selectedTab === 'people' && renderPeople()}
          </div>

          {/* Sidebar */}
          <div className="w-80 space-y-6">
            {/* Upcoming */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Upcoming</CardTitle>
              </CardHeader>
              <CardContent>
                {mockUpcoming.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">Woohoo, no work due soon!</p>
                    <Button variant="link" className="text-blue-600 p-0 h-auto">
                      View all
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {mockUpcoming.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded">
                        <div>
                          <p className="text-sm font-medium">{item.title}</p>
                          <p className="text-xs text-muted-foreground">{item.dueDate}</p>
                        </div>
                        <Badge variant="outline">{item.type}</Badge>
                      </div>
                    ))}
                    <Button variant="link" className="text-blue-600 p-0 h-auto w-full justify-start">
                      View all
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}



