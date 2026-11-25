"use client";

import React, { useState } from "react";
import { 
  GraduationCap, 
  Search, 
  Plus, 
  X, 
  Eye, 
  Edit3, 
  Trash2, 
  Lock, 
  Mail, 
  Building2, 
  Check, 
  Copy, 
  CheckCheck, 
  AlertCircle, 
  CheckCircle2, 
  Power, 
  EyeOff, 
  Sparkles,
  Filter
} from "lucide-react";
import { useAdminData } from "@/context/AdminDataContext";
import { Student } from "@/types/admin";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

function getInitials(name: string): string {
  if (!name) return "ST";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export default function StudentsPage() {
  const { 
    students, 
    departments, 
    addStudent, 
    editStudent, 
    toggleStudentStatus, 
    deleteStudent,
    activeRole,
  } = useAdminData();

  const isAdmin = activeRole === "admin";

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>("ALL");
  const [selectedYearFilter, setSelectedYearFilter] = useState<string>("ALL");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("ALL");

  // Modal States
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [detailsStudent, setDetailsStudent] = useState<Student | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [successCreatedStudent, setSuccessCreatedStudent] = useState<Student | null>(null);

  // Add Student Form State
  const [addForm, setAddForm] = useState({
    fullName: "",
    email: "",
    departmentId: "",
    academicYear: 1 as 1 | 2 | 3 | 4,
    semester: 1 as 1 | 2,
    defaultPassword: "",
  });
  const [showAddPassword, setShowAddPassword] = useState(false);
  const [addErrors, setAddErrors] = useState<Record<string, string>>({});
  const [copiedPassword, setCopiedPassword] = useState(false);

  // Edit Student Form State
  const [editForm, setEditForm] = useState({
    fullName: "",
    email: "",
    departmentId: "",
    academicYear: 1 as 1 | 2 | 3 | 4,
    semester: 1 as 1 | 2,
    accountStatus: "active" as "active" | "inactive",
  });
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});

  // Helper to get Department Name
  const getDeptName = (deptId: string): string => {
    const dept = departments.find((d) => d.id === deptId);
    return dept ? dept.name : "Department of Computer Science & Engineering";
  };

  // Filtered Students
  const filteredStudents = students.filter((std) => {
    const matchesSearch =
      std.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      std.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getDeptName(std.departmentId).toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDept =
      selectedDeptFilter === "ALL" || std.departmentId === selectedDeptFilter;

    const matchesYear =
      selectedYearFilter === "ALL" || std.academicYear.toString() === selectedYearFilter;

    const matchesStatus =
      selectedStatusFilter === "ALL" || std.accountStatus === selectedStatusFilter;

    return matchesSearch && matchesDept && matchesYear && matchesStatus;
  });

  // Open Add Student Modal
  const handleOpenAddModal = () => {
    setAddForm({
      fullName: "",
      email: "",
      departmentId: departments.length > 0 ? departments[0].id : "",
      academicYear: 1,
      semester: 1,
      defaultPassword: "",
    });
    setAddErrors({});
    setShowAddPassword(false);
    setAddModalOpen(true);
  };

  // Validate Add Student Form
  const validateAddForm = () => {
    const errs: Record<string, string> = {};
    if (!addForm.fullName.trim()) {
      errs.fullName = "Full Name is required.";
    }

    if (!addForm.email.trim()) {
      errs.email = "University email address is required.";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(addForm.email.trim())) {
        errs.email = "Please enter a valid email address (e.g., student@university.edu).";
      } else if (
        students.some(
          (s) => s.email.toLowerCase() === addForm.email.trim().toLowerCase()
        )
      ) {
        errs.email = "A student with this email is already registered.";
      }
    }

    if (!addForm.departmentId) {
      errs.departmentId = "Please select an academic department.";
    }

    if (![1, 2, 3, 4].includes(addForm.academicYear)) {
      errs.academicYear = "Please select an Academic Year.";
    }

    if (![1, 2].includes(addForm.semester)) {
      errs.semester = "Please select a Semester.";
    }

    if (!addForm.defaultPassword) {
      errs.defaultPassword = "Default password is required.";
    } else if (addForm.defaultPassword.length < 8) {
      errs.defaultPassword = "Default password must contain at least 8 characters.";
    }

    setAddErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Handle Add Student Submit
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAddForm()) return;

    const result = addStudent({
      fullName: addForm.fullName,
      email: addForm.email,
      departmentId: addForm.departmentId,
      academicYear: addForm.academicYear,
      semester: addForm.semester,
      defaultPassword: addForm.defaultPassword,
    });

    if (result.success && result.student) {
      setAddModalOpen(false);
      setSuccessCreatedStudent(result.student);
    } else if (result.error) {
      setAddErrors({ general: result.error });
    }
  };

  // Open Edit Student Modal
  const handleOpenEditModal = (student: Student) => {
    setEditingStudent(student);
    setEditForm({
      fullName: student.fullName,
      email: student.email,
      departmentId: student.departmentId,
      academicYear: student.academicYear,
      semester: student.semester,
      accountStatus: student.accountStatus,
    });
    setEditErrors({});
  };

  // Handle Edit Student Submit
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    const errs: Record<string, string> = {};
    if (!editForm.fullName.trim()) errs.fullName = "Full Name is required.";
    if (!editForm.email.trim()) {
      errs.email = "Email is required.";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(editForm.email.trim())) {
        errs.email = "Invalid email format.";
      } else if (
        students.some(
          (s) =>
            s.id !== editingStudent.id &&
            s.email.toLowerCase() === editForm.email.trim().toLowerCase()
        )
      ) {
        errs.email = "Email is already taken by another student.";
      }
    }

    if (Object.keys(errs).length > 0) {
      setEditErrors(errs);
      return;
    }

    const res = editStudent(editingStudent.id, {
      fullName: editForm.fullName,
      email: editForm.email,
      departmentId: editForm.departmentId,
      academicYear: editForm.academicYear,
      semester: editForm.semester,
      accountStatus: editForm.accountStatus,
    });

    if (res.success) {
      setEditingStudent(null);
    } else if (res.error) {
      setEditErrors({ general: res.error });
    }
  };

  // Copy default password to clipboard
  const handleCopyPassword = (pwd: string) => {
    navigator.clipboard.writeText(pwd);
    setCopiedPassword(true);
    setTimeout(() => setCopiedPassword(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
              Student Management
            </h2>
            <Badge variant="teal" size="sm">
              {students.length} Registered
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Create and maintain enrolled student records, departmental allocations, and credentials.
          </p>
        </div>

        {isAdmin && (
          <Button
            onClick={handleOpenAddModal}
            variant="primary"
            size="md"
            icon={<Plus className="w-4 h-4" />}
          >
            Add Student
          </Button>
        )}
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-card p-4 rounded-[16px] border border-border shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by student full name, email, or department..."
              className="w-full px-3.5 py-2 pl-9 rounded-xl border border-border text-xs focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent focus:border-transparent text-foreground bg-muted focus:bg-muted transition-all placeholder:text-muted-foreground"
            />
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-muted-foreground"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Counter */}
          <div className="text-xs text-muted-foreground flex items-center gap-2 self-end md:self-auto shrink-0">
            <span>Showing:</span>
            <strong className="text-foreground font-semibold">
              {filteredStudents.length} of {students.length}
            </strong>
          </div>
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border text-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground mr-1">
            <Filter className="w-3.5 h-3.5" />
            <span className="font-semibold text-[11px] uppercase tracking-wider">Filters:</span>
          </div>

          {/* Department Filter */}
          <select
            value={selectedDeptFilter}
            onChange={(e) => setSelectedDeptFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-border bg-muted text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent"
          >
            <option value="ALL">All Departments ({departments.length})</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          {/* Year Filter */}
          <select
            value={selectedYearFilter}
            onChange={(e) => setSelectedYearFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-border bg-muted text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent"
          >
            <option value="ALL">All Academic Years</option>
            <option value="1">Year 1</option>
            <option value="2">Year 2</option>
            <option value="3">Year 3</option>
            <option value="4">Year 4</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-border bg-muted text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent"
          >
            <option value="ALL">All Statuses</option>
            <option value="active">Active Accounts</option>
            <option value="inactive">Deactivated</option>
          </select>

          {/* Reset Filters button if any active */}
          {(selectedDeptFilter !== "ALL" || selectedYearFilter !== "ALL" || selectedStatusFilter !== "ALL" || searchQuery) && (
            <button
              onClick={() => {
                setSelectedDeptFilter("ALL");
                setSelectedYearFilter("ALL");
                setSelectedStatusFilter("ALL");
                setSearchQuery("");
              }}
              className="text-xs text-teal-600 hover:text-accent-hover font-semibold px-2 py-1 rounded-md hover:bg-teal-50 transition-colors"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Students Directory Table */}
      <div className="bg-card rounded-[16px] border border-border shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted border-b border-border text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                <th className="py-3.5 px-4 sm:px-6">Student</th>
                <th className="py-3.5 px-4">Department</th>
                <th className="py-3.5 px-3">Year</th>
                <th className="py-3.5 px-3">Semester</th>
                <th className="py-3.5 px-4">Account Status</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-xs">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    <GraduationCap className="w-9 h-9 mx-auto mb-2 text-muted-foreground/60" />
                    <p className="font-semibold text-foreground text-sm">No students match your criteria</p>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      {searchQuery || selectedDeptFilter !== "ALL"
                        ? "Try adjusting your search terms or filters."
                        : "Click 'Add Student' above to register the university's first student."}
                    </p>
                    <div className="mt-4">
                      <Button
                        onClick={handleOpenAddModal}
                        variant="primary"
                        size="sm"
                        icon={<Plus className="w-3.5 h-3.5" />}
                      >
                        Add Student
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((std) => (
                  <tr
                    key={std.id}
                    className="hover:bg-muted/40 transition-colors group"
                  >
                    {/* Profile Photo / Avatar & Name & Email */}
                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        {std.profilePhotoUrl ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={std.profilePhotoUrl}
                            alt={std.fullName}
                            className="w-9 h-9 rounded-full object-cover border border-border shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-500 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                            {getInitials(std.fullName)}
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-foreground group-hover:text-accent transition-colors">
                            {std.fullName}
                          </p>
                          <span className="text-[11px] text-muted-foreground font-mono block">
                            {std.email}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Department */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <span className="font-medium text-foreground truncate block text-xs">
                        {getDeptName(std.departmentId)}
                      </span>
                    </td>

                    {/* Academic Year */}
                    <td className="py-3.5 px-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                        Year {std.academicYear}
                      </span>
                    </td>

                    {/* Semester */}
                    <td className="py-3.5 px-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-teal-50 text-teal-700 border border-teal-100">
                        Sem {std.semester}
                      </span>
                    </td>

                    {/* Account Status */}
                    <td className="py-3.5 px-4">
                      {std.accountStatus === "active" ? (
                        <span className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground border border-border font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" /> Deactivated
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 sm:px-6 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setDetailsStudent(std)}
                          className="p-1.5 text-muted-foreground hover:text-accent hover:bg-teal-50 rounded-lg transition-colors"
                          title="View Student Details"
                          aria-label="View Student Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleOpenEditModal(std)}
                          className="p-1.5 text-muted-foreground hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Edit Student Profile"
                          aria-label="Edit Student Profile"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => toggleStudentStatus(std.id)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            std.accountStatus === "active"
                              ? "text-muted-foreground hover:text-amber-600 hover:bg-amber-50"
                              : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                          }`}
                          title={std.accountStatus === "active" ? "Deactivate Student" : "Activate Student"}
                          aria-label={std.accountStatus === "active" ? "Deactivate Student" : "Activate Student"}
                        >
                          <Power className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => {
                            if (confirm(`Are you sure you want to remove student "${std.fullName}"?`)) {
                              deleteStudent(std.id);
                            }
                          }}
                          className="p-1.5 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete Student Record"
                          aria-label="Delete Student Record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* -------------------- ADD STUDENT MODAL -------------------- */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm backdrop-blur-xs animate-in fade-in-50">
          <div className="bg-card w-full max-w-lg rounded-[16px] border border-border shadow-2xl p-6 sm:p-7 space-y-5 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 text-teal-600 flex items-center justify-center shrink-0">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-foreground">
                    Add New Student
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Create an enrolled student credential linked to an official department.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAddModalOpen(false)}
                className="text-muted-foreground hover:text-muted-foreground p-1 rounded-lg"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {addErrors.general && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{addErrors.general}</span>
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="space-y-4">
              {/* Field 1: Full Name */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={addForm.fullName}
                  onChange={(e) => {
                    setAddForm({ ...addForm, fullName: e.target.value });
                    if (addErrors.fullName) setAddErrors((prev) => ({ ...prev, fullName: "" }));
                  }}
                  placeholder="Enter student's full name"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs text-foreground bg-card focus:outline-none focus:ring-2 ${
                    addErrors.fullName
                      ? "border-rose-300 focus:ring-rose-500"
                      : "border-border focus:ring-accent focus:border-accent focus:border-transparent"
                  }`}
                />
                {addErrors.fullName && (
                  <p className="mt-1 text-[11px] text-rose-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {addErrors.fullName}
                  </p>
                )}
              </div>

              {/* Field 2: Email Address */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  University Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={addForm.email}
                    onChange={(e) => {
                      setAddForm({ ...addForm, email: e.target.value });
                      if (addErrors.email) setAddErrors((prev) => ({ ...prev, email: "" }));
                    }}
                    placeholder="student.name@university.edu"
                    className={`w-full px-3.5 py-2.5 pl-9 rounded-xl border text-xs text-foreground bg-card focus:outline-none focus:ring-2 ${
                      addErrors.email
                        ? "border-rose-300 focus:ring-rose-500"
                        : "border-border focus:ring-accent focus:border-accent focus:border-transparent"
                    }`}
                  />
                  <Mail className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
                </div>
                {addErrors.email && (
                  <p className="mt-1 text-[11px] text-rose-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {addErrors.email}
                  </p>
                )}
              </div>

              {/* Field 3: Department Selection */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Department <span className="text-rose-500">*</span>
                </label>
                {departments.length === 0 ? (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                    No departments found. Please create at least one department first under Department Management.
                  </div>
                ) : (
                  <div className="relative">
                    <select
                      value={addForm.departmentId}
                      onChange={(e) => {
                        setAddForm({ ...addForm, departmentId: e.target.value });
                        if (addErrors.departmentId) setAddErrors((prev) => ({ ...prev, departmentId: "" }));
                      }}
                      className={`w-full px-3.5 py-2.5 pl-9 rounded-xl border text-xs text-foreground bg-card focus:outline-none focus:ring-2 appearance-none ${
                        addErrors.departmentId
                          ? "border-rose-300 focus:ring-rose-500"
                          : "border-border focus:ring-accent focus:border-accent focus:border-transparent"
                      }`}
                    >
                      <option value="" disabled>
                        Select a department...
                      </option>
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                    <Building2 className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5 pointer-events-none" />
                  </div>
                )}
                {addErrors.departmentId && (
                  <p className="mt-1 text-[11px] text-rose-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {addErrors.departmentId}
                  </p>
                )}
              </div>

              {/* Fields 4 & 5: Academic Year & Semester in a 2-Column Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Academic Year */}
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Academic Year <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={addForm.academicYear}
                    onChange={(e) =>
                      setAddForm({
                        ...addForm,
                        academicYear: Number(e.target.value) as 1 | 2 | 3 | 4,
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border text-xs text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent focus:border-transparent"
                  >
                    <option value={1}>Year 1</option>
                    <option value={2}>Year 2</option>
                    <option value={3}>Year 3</option>
                    <option value={4}>Year 4</option>
                  </select>
                </div>

                {/* Semester */}
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Semester <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={addForm.semester}
                    onChange={(e) =>
                      setAddForm({
                        ...addForm,
                        semester: Number(e.target.value) as 1 | 2,
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border text-xs text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent focus:border-transparent"
                  >
                    <option value={1}>Semester 1</option>
                    <option value={2}>Semester 2</option>
                  </select>
                </div>
              </div>

              {/* Field 6: Default Password */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Default Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showAddPassword ? "text" : "password"}
                    value={addForm.defaultPassword}
                    onChange={(e) => {
                      setAddForm({ ...addForm, defaultPassword: e.target.value });
                      if (addErrors.defaultPassword) setAddErrors((prev) => ({ ...prev, defaultPassword: "" }));
                    }}
                    placeholder="Enter default password (minimum 8 characters)"
                    className={`w-full px-3.5 py-2.5 pl-9 pr-10 rounded-xl border text-xs text-foreground bg-card focus:outline-none focus:ring-2 ${
                      addErrors.defaultPassword
                        ? "border-rose-300 focus:ring-rose-500"
                        : "border-border focus:ring-accent focus:border-accent focus:border-transparent"
                    }`}
                  />
                  <Lock className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
                  <button
                    type="button"
                    onClick={() => setShowAddPassword(!showAddPassword)}
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-muted-foreground focus:outline-none"
                    aria-label="Toggle password visibility"
                  >
                    {showAddPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {addErrors.defaultPassword ? (
                  <p className="mt-1 text-[11px] text-rose-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {addErrors.defaultPassword}
                  </p>
                ) : (
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Set a customized temporary password for this student. Must be at least 8 characters.
                  </p>
                )}
              </div>

              {/* Profile Photo Notice Box */}
              <div className="p-3 rounded-xl bg-muted border border-border text-[11px] text-muted-foreground flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Profile Photo:</strong> Students upload their own profile photo later upon signing into the student portal. Default initials avatar will be shown initially.
                </span>
              </div>

              {/* Form Action Buttons */}
              <div className="pt-3 border-t border-border flex items-center justify-end gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={() => setAddModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  icon={<Check className="w-4 h-4" />}
                >
                  Create Student Account
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -------------------- SUCCESS CONFIRMATION MODAL -------------------- */}
      {successCreatedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm backdrop-blur-xs animate-in fade-in-50">
          <div className="bg-card w-full max-w-md rounded-[16px] border border-border shadow-2xl p-6 sm:p-7 space-y-5 animate-in zoom-in-95 duration-150">
            {/* Header with success badge */}
            <div className="text-center space-y-2">
              <div className="w-13 h-13 rounded-[16px] bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-extrabold text-foreground">
                Student Account Created!
              </h3>
              <p className="text-xs text-muted-foreground">
                The student account has been provisioned and is ready for initial onboarding.
              </p>
            </div>

            {/* Confirmation Summary Card */}
            <div className="p-4 rounded-xl bg-muted border border-border space-y-2.5 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-border/60">
                <span className="text-muted-foreground font-medium">Student Full Name</span>
                <span className="font-bold text-foreground">{successCreatedStudent.fullName}</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-border/60">
                <span className="text-muted-foreground font-medium">Email Address</span>
                <span className="font-mono font-semibold text-foreground">{successCreatedStudent.email}</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-border/60">
                <span className="text-muted-foreground font-medium">Department</span>
                <span className="font-medium text-foreground text-right max-w-[200px] truncate">
                  {getDeptName(successCreatedStudent.departmentId)}
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-border/60">
                <span className="text-muted-foreground font-medium">Academic Standing</span>
                <span className="font-semibold text-indigo-700">
                  Year {successCreatedStudent.academicYear} • Semester {successCreatedStudent.semester}
                </span>
              </div>

              <div className="flex justify-between items-center py-1">
                <span className="text-muted-foreground font-medium">Default Password</span>
                <div className="flex items-center gap-1.5 font-mono font-bold text-foreground bg-card px-2 py-0.5 rounded border border-border">
                  <span>{successCreatedStudent.defaultPassword || "********"}</span>
                  {successCreatedStudent.defaultPassword && (
                    <button
                      onClick={() => handleCopyPassword(successCreatedStudent.defaultPassword!)}
                      className="text-muted-foreground hover:text-teal-600 p-0.5 transition-colors"
                      title="Copy default password"
                      aria-label="Copy default password"
                    >
                      {copiedPassword ? (
                        <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Mandatory Change Warning Notice */}
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                The student can use this email address and default password to sign in. The student should change the default password after their first login.
              </p>
            </div>

            {/* Modal Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
              <Button
                variant="outline"
                size="md"
                onClick={() => {
                  setSuccessCreatedStudent(null);
                  handleOpenAddModal();
                }}
                className="w-full sm:w-1/2 justify-center"
                icon={<Plus className="w-4 h-4" />}
              >
                Add Another
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => setSuccessCreatedStudent(null)}
                className="w-full sm:w-1/2 justify-center"
              >
                View Students
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* -------------------- STUDENT DETAILS MODAL -------------------- */}
      {detailsStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm backdrop-blur-xs animate-in fade-in-50">
          <div className="bg-card w-full max-w-md rounded-[16px] border border-border shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-3">
                {detailsStudent.profilePhotoUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={detailsStudent.profilePhotoUrl}
                    alt={detailsStudent.fullName}
                    className="w-12 h-12 rounded-full object-cover border border-border shrink-0 shadow-xs"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-500 to-indigo-600 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-xs">
                    {getInitials(detailsStudent.fullName)}
                  </div>
                )}
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    {detailsStudent.fullName}
                  </h3>
                  <p className="text-xs text-muted-foreground font-mono">
                    {detailsStudent.email}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDetailsStudent(null)}
                className="text-muted-foreground hover:text-muted-foreground p-1 rounded-lg"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Overview Details */}
            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-xl bg-muted border border-border flex justify-between items-center">
                <span className="text-muted-foreground font-medium">Department</span>
                <span className="font-semibold text-foreground text-right max-w-[220px] truncate">
                  {getDeptName(detailsStudent.departmentId)}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-muted border border-border flex justify-between items-center">
                <span className="text-muted-foreground font-medium">Academic Standing</span>
                <span className="font-semibold text-indigo-700">
                  Year {detailsStudent.academicYear} • Semester {detailsStudent.semester}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-muted border border-border flex justify-between items-center">
                <span className="text-muted-foreground font-medium">Account Status</span>
                {detailsStudent.accountStatus === "active" ? (
                  <span className="inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400" /> Deactivated
                  </span>
                )}
              </div>

              <div className="p-3 rounded-xl bg-muted border border-border flex justify-between items-center">
                <span className="text-muted-foreground font-medium">Enrolled Date</span>
                <span className="font-medium text-foreground">{detailsStudent.createdAt}</span>
              </div>

              {/* Future Profile Editing Placeholder Section */}
              <div className="p-3.5 rounded-xl bg-teal-50/70 border border-teal-200 text-teal-900 text-[11px] space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-teal-800">
                  <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                  <span>Student Portal Self-Service</span>
                </div>
                <p className="text-teal-700 leading-relaxed">
                  The student will upload their official profile photo, connect their GitHub repositories, and join Capstone teams once they sign in with their default password.
                </p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-2 border-t border-border flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const toEdit = detailsStudent;
                  setDetailsStudent(null);
                  handleOpenEditModal(toEdit);
                }}
                icon={<Edit3 className="w-3.5 h-3.5" />}
              >
                Edit Student
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={() => setDetailsStudent(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* -------------------- EDIT STUDENT MODAL -------------------- */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm backdrop-blur-xs animate-in fade-in-50">
          <div className="bg-card w-full max-w-md rounded-[16px] border border-border shadow-2xl p-6 sm:p-7 space-y-4 animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    Edit Student Information
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Update profile, department, or enrollment standing.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingStudent(null)}
                className="text-muted-foreground hover:text-muted-foreground p-1 rounded-lg"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editErrors.general && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{editErrors.general}</span>
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-foreground mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={editForm.fullName}
                  onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-border text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
                />
                {editErrors.fullName && (
                  <p className="mt-1 text-[11px] text-rose-600">{editErrors.fullName}</p>
                )}
              </div>

              <div>
                <label className="block font-semibold text-foreground mb-1">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-border text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
                />
                {editErrors.email && (
                  <p className="mt-1 text-[11px] text-rose-600">{editErrors.email}</p>
                )}
              </div>

              <div>
                <label className="block font-semibold text-foreground mb-1">
                  Department <span className="text-rose-500">*</span>
                </label>
                <select
                  value={editForm.departmentId}
                  onChange={(e) => setEditForm({ ...editForm, departmentId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-border text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-foreground mb-1">
                    Academic Year
                  </label>
                  <select
                    value={editForm.academicYear}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        academicYear: Number(e.target.value) as 1 | 2 | 3 | 4,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-border text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
                  >
                    <option value={1}>Year 1</option>
                    <option value={2}>Year 2</option>
                    <option value={3}>Year 3</option>
                    <option value={4}>Year 4</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-foreground mb-1">
                    Semester
                  </label>
                  <select
                    value={editForm.semester}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        semester: Number(e.target.value) as 1 | 2,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-border text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
                  >
                    <option value={1}>Semester 1</option>
                    <option value={2}>Semester 2</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-foreground mb-1">
                  Account Status
                </label>
                <select
                  value={editForm.accountStatus}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      accountStatus: e.target.value as "active" | "inactive",
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-border text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive / Deactivated</option>
                </select>
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-end gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={() => setEditingStudent(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  icon={<Check className="w-4 h-4" />}
                >
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
