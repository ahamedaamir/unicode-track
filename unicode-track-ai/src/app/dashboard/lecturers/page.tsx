"use client";

import React, { useState } from "react";
import { 
  Users, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  X, 
  Eye, 
  KeyRound, 
  AlertCircle, 
  Check, 
  Copy, 
  CheckCheck, 
  Power,
  Camera
} from "lucide-react";
import { useAdminData } from "@/context/AdminDataContext";
import { Lecturer } from "@/types/admin";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export default function LecturersPage() {
  const { 
    lecturers, 
    courses, 
    addLecturer, 
    editLecturer, 
    toggleLecturerStatus, 
    deleteLecturer 
  } = useAdminData();

  const [searchQuery, setSearchQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLecturer, setEditingLecturer] = useState<Lecturer | null>(null);
  const [detailsLecturer, setDetailsLecturer] = useState<Lecturer | null>(null);
  const [createdCredentials, setCreatedCredentials] = useState<{
    name: string;
    email: string;
    defaultPassword: string;
  } | null>(null);

  // Form Fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [position, setPosition] = useState<"Senior" | "Probationary">("Senior");
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [formErrors, setFormErrors] = useState<{ name?: string; email?: string }>({});
  const [copied, setCopied] = useState(false);

  const filteredLecturers = lecturers.filter(
    (l) =>
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenAdd = () => {
    setEditingLecturer(null);
    setName("");
    setEmail("");
    setPosition("Senior");
    setSelectedCourses([]);
    setFormErrors({});
    setModalOpen(true);
  };

  const handleOpenEdit = (lec: Lecturer) => {
    setEditingLecturer(lec);
    setName(lec.name);
    setEmail(lec.email);
    setPosition(lec.position);
    setSelectedCourses([...lec.assignedCourses]);
    setFormErrors({});
    setModalOpen(true);
  };

  const handleCourseToggle = (code: string) => {
    if (selectedCourses.includes(code)) {
      setSelectedCourses(selectedCourses.filter((c) => c !== code));
    } else {
      setSelectedCourses([...selectedCourses, code]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: typeof formErrors = {};
    if (!name.trim()) errors.name = "Lecturer Name is required";
    if (!email.trim()) errors.email = "Email Address is required";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    if (editingLecturer) {
      const res = editLecturer(editingLecturer.id, {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        position,
        assignedCourses: selectedCourses,
      });
      if (res.success) {
        setModalOpen(false);
      }
    } else {
      const res = addLecturer({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        position,
        assignedCourses: selectedCourses,
      });

      if (!res.success) {
        setFormErrors({ email: res.error });
        return;
      }

      setModalOpen(false);
      if (res.lecturer) {
        setCreatedCredentials({
          name: res.lecturer.name,
          email: res.lecturer.email,
          defaultPassword: res.lecturer.defaultPassword,
        });
      }
    }
  };

  const handleCopyPassword = () => {
    if (createdCredentials) {
      navigator.clipboard.writeText(createdCredentials.defaultPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDelete = (id: string, lecName: string) => {
    if (confirm(`Are you sure you want to delete lecturer account for "${lecName}"?`)) {
      deleteLecturer(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
              Lecturer Management
            </h2>
            <Badge variant="teal" size="sm">
              {lecturers.length} Total Staff
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Register academic lecturers, assign active curriculum courses, and monitor first-login credential status.
          </p>
        </div>

        <Button
          onClick={handleOpenAdd}
          variant="primary"
          size="md"
          icon={<Plus className="w-4 h-4" />}
        >
          Add Lecturer
        </Button>
      </div>

      {/* Search Bar & Counter Bar */}
      <div className="bg-card p-4 rounded-[16px] border border-border shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by lecturer name or email..."
            className="w-full px-3.5 py-2 pl-9 rounded-xl border border-border text-xs focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent focus:border-transparent text-foreground bg-muted focus:bg-muted transition-all placeholder:text-muted-foreground"
          />
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-muted-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="text-xs text-muted-foreground flex items-center gap-2 self-end sm:self-auto">
          <span>Active Staff Roster:</span>
          <strong className="text-foreground font-semibold">{filteredLecturers.length} of {lecturers.length}</strong>
        </div>
      </div>

      {/* Lecturers Table Card */}
      <div className="bg-card rounded-[16px] border border-border shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted border-b border-border text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                <th className="py-3.5 px-4 sm:px-6">Lecturer Name</th>
                <th className="py-3.5 px-4">Email Address</th>
                <th className="py-3.5 px-4">Position</th>
                <th className="py-3.5 px-4">Assigned Courses</th>
                <th className="py-3.5 px-4">Account Status</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-xs">
              {filteredLecturers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    <Users className="w-8 h-8 mx-auto mb-2 text-muted-foreground/60" />
                    <p className="font-semibold text-muted-foreground">No lecturers found</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {searchQuery ? `No match for "${searchQuery}".` : "Click 'Add Lecturer' to register staff."}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredLecturers.map((lec) => {
                  const initials = lec.name
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase();

                  return (
                    <tr
                      key={lec.id}
                      className="hover:bg-muted/40 transition-colors group"
                    >
                      {/* Name & Avatar */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-muted border border-border text-foreground font-bold text-xs flex items-center justify-center shrink-0">
                            {initials}
                          </div>
                          <div>
                            <p className="font-bold text-foreground group-hover:text-accent transition-colors">
                              {lec.name}
                            </p>
                            <span className="text-[10px] text-muted-foreground">
                              Joined {lec.createdAt}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="py-3.5 px-4 font-mono text-muted-foreground">
                        {lec.email}
                      </td>

                      {/* Position */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                            lec.position === "Senior"
                              ? "bg-purple-50 text-purple-700 border-purple-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                        >
                          {lec.position}
                        </span>
                      </td>

                      {/* Assigned Courses */}
                      <td className="py-3.5 px-4">
                        {lec.assignedCourses && lec.assignedCourses.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {lec.assignedCourses.map((code) => (
                              <span
                                key={code}
                                className="px-1.5 py-0.5 rounded font-mono font-bold text-[10px] bg-muted text-foreground border border-border"
                              >
                                {code}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[11px] text-muted-foreground italic">None</span>
                        )}
                      </td>

                      {/* Account Status */}
                      <td className="py-3.5 px-4">
                        {lec.status === "Deactivated" ? (
                          <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground border border-border font-medium">
                            Deactivated
                          </span>
                        ) : !lec.hasChangedDefaultPassword ? (
                          <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-semibold" title="Default password must be updated on first login">
                            <KeyRound className="w-3 h-3 text-amber-600" /> Pending 1st Login
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 sm:px-6 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setDetailsLecturer(lec)}
                            className="p-1.5 text-muted-foreground hover:text-accent hover:bg-teal-50 rounded-lg transition-colors"
                            title="View Lecturer Profile"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(lec)}
                            className="p-1.5 text-muted-foreground hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Edit Lecturer Information"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => toggleLecturerStatus(lec.id)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              lec.status === "Deactivated"
                                ? "text-emerald-600 hover:bg-emerald-50"
                                : "text-amber-600 hover:bg-amber-50"
                            }`}
                            title={lec.status === "Deactivated" ? "Activate Account" : "Deactivate Account"}
                          >
                            <Power className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(lec.id, lec.name)}
                            className="p-1.5 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete Account"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Lecturer Modal Dialog */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm backdrop-blur-xs animate-in fade-in-50">
          <div className="bg-card w-full max-w-lg rounded-[16px] border border-border shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-foreground">
                  {editingLecturer ? "Edit Lecturer Details" : "Register New Lecturer"}
                </h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-muted-foreground hover:text-muted-foreground p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Lecturer Name */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Lecturer Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  autoFocus
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (formErrors.name) setFormErrors((prev) => ({ ...prev, name: undefined }));
                  }}
                  placeholder="e.g. Dr. Sarah Al-Mansoor"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-foreground bg-card focus:outline-none focus:ring-2 ${
                    formErrors.name
                      ? "border-rose-300 focus:ring-rose-200"
                      : "border-border focus:ring-teal-200 focus:border-[#14B8A6]"
                  }`}
                />
                {formErrors.name && (
                  <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {formErrors.name}
                  </p>
                )}
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (formErrors.email) setFormErrors((prev) => ({ ...prev, email: undefined }));
                  }}
                  placeholder="e.g. lecturer@university.edu"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-foreground bg-card focus:outline-none focus:ring-2 ${
                    formErrors.email
                      ? "border-rose-300 focus:ring-rose-200"
                      : "border-border focus:ring-teal-200 focus:border-[#14B8A6]"
                  }`}
                />
                {formErrors.email && (
                  <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {formErrors.email}
                  </p>
                )}
              </div>

              {/* Position Dropdown */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Position <span className="text-rose-500">*</span>
                </label>
                <select
                  value={position}
                  onChange={(e) => setPosition(e.target.value as "Senior" | "Probationary")}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border text-sm text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-[#14B8A6]"
                >
                  <option value="Senior">Senior</option>
                  <option value="Probationary">Probationary</option>
                </select>
              </div>

              {/* Assign Courses (Multi-Select Checklist from previously created courses) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-foreground">
                    Assign Courses (Select one or multiple)
                  </label>
                  <span className="text-[11px] text-teal-700 font-medium">
                    {selectedCourses.length} selected
                  </span>
                </div>

                {courses.length === 0 ? (
                  <div className="p-3 rounded-xl bg-muted border border-border text-xs text-muted-foreground text-center">
                    No courses available yet. Please create courses in Course Management first.
                  </div>
                ) : (
                  <div className="p-2.5 rounded-xl border border-border bg-muted max-h-44 overflow-y-auto space-y-1.5">
                    {courses.map((crs) => {
                      const isSelected = selectedCourses.includes(crs.code);
                      return (
                        <label
                          key={crs.id}
                          className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                            isSelected
                              ? "bg-teal-50/80 border-teal-300 text-teal-950 font-medium"
                              : "bg-card border-border hover:bg-muted text-foreground"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleCourseToggle(crs.code)}
                              className="w-4 h-4 rounded text-[#14B8A6] focus:ring-accent focus:border-accent border-border"
                            />
                            <span className="font-mono font-bold text-[11px] text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                              {crs.code}
                            </span>
                            <span>{crs.name}</span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
                <p className="text-[11px] text-muted-foreground mt-1">
                  Only official courses created in the university catalog are eligible.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-border flex items-center justify-end gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                >
                  {editingLecturer ? "Save Changes" : "Create Lecturer Account"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Account Created Credentials Modal Banner */}
      {createdCredentials && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm backdrop-blur-xs animate-in fade-in-50">
          <div className="bg-card w-full max-w-md rounded-[16px] border border-border shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-[16px] bg-teal-50 border border-teal-200 text-[#14B8A6] flex items-center justify-center mx-auto">
              <Check className="w-6 h-6 stroke-[3]" />
            </div>

            <div className="text-center">
              <h3 className="text-lg font-extrabold text-foreground">
                Lecturer Account Created!
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Share these initial credentials with <strong className="text-foreground">{createdCredentials.name}</strong>
              </p>
            </div>

            <div className="p-4 rounded-xl bg-muted border border-border space-y-2 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-border/70">
                <span className="text-muted-foreground font-medium">Lecturer Email</span>
                <span className="font-mono font-bold text-foreground">{createdCredentials.email}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-muted-foreground font-medium">Default Password</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-teal-800 bg-card px-2 py-0.5 rounded border border-teal-200">
                    {createdCredentials.defaultPassword}
                  </span>
                  <button
                    onClick={handleCopyPassword}
                    className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted"
                    title="Copy password"
                  >
                    {copied ? <CheckCheck className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Warning requirement */}
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong className="font-bold">Security Requirement:</strong> The lecturer must change this password during their first login before accessing the lecturer dashboard.
              </p>
            </div>

            <Button
              onClick={() => setCreatedCredentials(null)}
              variant="primary"
              size="md"
              className="w-full justify-center"
            >
              Done & Return to Roster
            </Button>
          </div>
        </div>
      )}

      {/* Lecturer Profile / Details Modal */}
      {detailsLecturer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm backdrop-blur-xs animate-in fade-in-50">
          <div className="bg-card w-full max-w-lg rounded-[16px] border border-border shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-150">
            {/* Header with default avatar */}
            <div className="flex items-start justify-between pb-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-[16px] bg-teal-50 border border-teal-200 text-teal-700 font-bold text-base flex items-center justify-center shrink-0">
                  {detailsLecturer.name
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">
                    {detailsLecturer.name}
                  </h3>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">
                    {detailsLecturer.email}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setDetailsLecturer(null)}
                className="text-muted-foreground hover:text-muted-foreground p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Placeholder Notice */}
            <div className="p-3 bg-muted rounded-xl border border-border text-xs text-muted-foreground flex items-center gap-2.5">
              <Camera className="w-4 h-4 text-muted-foreground shrink-0" />
              <span>
                <strong>Profile Photo:</strong> The lecturer will upload their profile photo upon their first login.
              </span>
            </div>

            {/* Meta Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-muted border border-border">
                <span className="text-muted-foreground text-[10px] uppercase font-bold block">Academic Position</span>
                <span className="font-semibold text-foreground mt-0.5 inline-block">{detailsLecturer.position}</span>
              </div>
              <div className="p-3 rounded-xl bg-muted border border-border">
                <span className="text-muted-foreground text-[10px] uppercase font-bold block">Security Status</span>
                <span className="font-semibold text-foreground mt-0.5 inline-block">
                  {detailsLecturer.hasChangedDefaultPassword ? "Password Updated" : "Pending First Login"}
                </span>
              </div>
            </div>

            {/* Assigned Courses */}
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">
                Assigned Curriculum Courses
              </span>
              {detailsLecturer.assignedCourses && detailsLecturer.assignedCourses.length > 0 ? (
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {detailsLecturer.assignedCourses.map((code) => {
                    const fullCourse = courses.find((c) => c.code === code);
                    return (
                      <div
                        key={code}
                        className="flex items-center justify-between p-2 rounded-lg bg-card border border-border text-xs"
                      >
                        <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                          {code}
                        </span>
                        <span className="font-medium text-foreground truncate max-w-xs">
                          {fullCourse ? fullCourse.name : "Curriculum Course"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">No courses currently assigned.</p>
              )}
            </div>

            <div className="pt-3 border-t border-border flex items-center justify-end">
              <Button
                variant="outline"
                size="md"
                onClick={() => setDetailsLecturer(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
