"use client";

import React, { useState } from "react";
import { 
  Building2, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  X, 
  AlertCircle, 
  Calendar
} from "lucide-react";
import { useAdminData } from "@/context/AdminDataContext";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export default function DepartmentsPage() {
  const { departments, addDepartment, editDepartment, deleteDepartment } = useAdminData();

  const [searchQuery, setSearchQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDeptId, setEditingDeptId] = useState<string | null>(null);
  const [deptName, setDeptName] = useState("");
  const [formError, setFormError] = useState("");

  const filteredDepartments = departments.filter((dept) =>
    dept.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenAdd = () => {
    setEditingDeptId(null);
    setDeptName("");
    setFormError("");
    setModalOpen(true);
  };

  const handleOpenEdit = (dept: { id: string; name: string }) => {
    setEditingDeptId(dept.id);
    setDeptName(dept.name);
    setFormError("");
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptName.trim()) {
      setFormError("Department Name is required");
      return;
    }

    if (editingDeptId) {
      const res = editDepartment(editingDeptId, deptName);
      if (!res.success) {
        setFormError(res.error || "Failed to update department");
        return;
      }
    } else {
      const res = addDepartment(deptName);
      if (!res.success) {
        setFormError(res.error || "Failed to create department");
        return;
      }
    }

    setModalOpen(false);
    setDeptName("");
    setEditingDeptId(null);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      deleteDepartment(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
              Department Management
            </h2>
            <Badge variant="teal" size="sm">
              {departments.length} Total
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Create, update, and manage official university academic departments.
          </p>
        </div>

        <Button
          onClick={handleOpenAdd}
          variant="primary"
          size="md"
          icon={<Plus className="w-4 h-4" />}
        >
          Add Department
        </Button>
      </div>

      {/* Search Bar & Summary Banner */}
      <div className="bg-card p-4 rounded-[16px] border border-border shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by department name..."
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
          <span>Showing:</span>
          <strong className="text-foreground font-semibold">{filteredDepartments.length} of {departments.length}</strong>
        </div>
      </div>

      {/* Departments Table Card */}
      <div className="bg-card rounded-[16px] border border-border shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted border-b border-border text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                <th className="py-3.5 px-4 sm:px-6">Department Name</th>
                <th className="py-3.5 px-4 hidden md:table-cell">Date Created</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-xs">
              {filteredDepartments.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-12 text-center text-muted-foreground">
                    <Building2 className="w-8 h-8 mx-auto mb-2 text-muted-foreground/60" />
                    <p className="font-semibold text-muted-foreground">No departments found</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {searchQuery
                        ? `No match for "${searchQuery}". Try clearing search.`
                        : "Click 'Add Department' to create the first department."}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredDepartments.map((dept) => (
                  <tr
                    key={dept.id}
                    className="hover:bg-muted/40 transition-colors group"
                  >
                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-xs shrink-0 border border-teal-100">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-foreground group-hover:text-accent transition-colors">
                            {dept.name}
                          </p>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            ID: {dept.id}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 hidden md:table-cell text-muted-foreground font-mono">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>{dept.createdAt}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 sm:px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(dept)}
                          className="p-1.5 text-muted-foreground hover:text-accent hover:bg-teal-50 rounded-lg transition-colors"
                          title="Edit department name"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(dept.id, dept.name)}
                          className="p-1.5 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete department"
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

      {/* Add / Edit Department Dialog Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm backdrop-blur-xs animate-in fade-in-50">
          <div className="bg-card w-full max-w-md rounded-[16px] border border-border shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-foreground">
                  {editingDeptId ? "Edit Department Name" : "Add New Department"}
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
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Department Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  autoFocus
                  value={deptName}
                  onChange={(e) => {
                    setDeptName(e.target.value);
                    if (formError) setFormError("");
                  }}
                  placeholder="e.g. Department of Information Technology"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all text-foreground bg-card focus:outline-none focus:ring-2 ${
                    formError
                      ? "border-rose-300 focus:ring-rose-200"
                      : "border-border focus:ring-teal-200 focus:border-[#14B8A6]"
                  }`}
                />
                {formError && (
                  <p className="text-xs text-rose-500 mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {formError}
                  </p>
                )}
                <p className="text-[11px] text-muted-foreground mt-1.5">
                  Only the official department title is required.
                </p>
              </div>

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
                  Save Department
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
