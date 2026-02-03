"use client"

import React from 'react'
import {
    Plus,
    FileText,
    Eye,
    Trash2,
    Copy,
} from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { useState } from 'react';
import "./yourform.css"

const page = () => {

    const [isEvent, setIsEvent] = useState(true);
    const [forms, setForms] = useState([]);
    

    useEffect(() => {
        const savedForms = localStorage.getItem("unilynk-forms");
        if (savedForms) {
            setForms(JSON.parse(savedForms));
        }
    }, []);

    const createNewForm = () => {
        const newForm = {
            id: Date.now().toString(),
            title: "Untitled Form",
            description: "",
            createdAt: new Date().toISOString(),
            questions: 0,
        };

        const updatedForms = [newForm, ...forms];
        setForms(updatedForms);
        localStorage.setItem(
            "unilynk-forms",
            JSON.stringify(updatedForms),
        );
    };

    const deleteForm = (id, e) => {
        e.preventDefault();
        e.stopPropagation();
        const updatedForms = forms.filter((form) => form.id !== id);
        setForms(updatedForms);
        localStorage.setItem(
            "unilynk-forms",
            JSON.stringify(updatedForms),
        );
        localStorage.removeItem(`unilynk-form-${id}`);
    };

    const duplicateForm = (id, e) => {
        e.preventDefault();
        e.stopPropagation();
        const formToDuplicate = forms.find(
            (form) => form.id === id,
        );
        if (formToDuplicate) {
            const newForm = {
                ...formToDuplicate,
                id: Date.now().toString(),
                title: `${formToDuplicate.title} (Copy)`,
                createdAt: new Date().toISOString(),
            };
            const updatedForms = [newForm, ...forms];
            setForms(updatedForms);
            localStorage.setItem(
                "unilynk-forms",
                JSON.stringify(updatedForms),
            );

            // Duplicate form data
            const formData = localStorage.getItem(
                `unilynk-form-${id}`,
            );
            if (formData) {
                localStorage.setItem(
                    `unilynk-form-${newForm.id}`,
                    formData,
                );
            }
        }
    };

    return (
        <div className="home-container">

            {/* Main Content */}
            <main className="home-main">
                {forms.length === 0 ? (
                    <div className="home-empty-state">
                        <div className="home-empty-icon">
                            <FileText />
                        </div>
                        <h2 className="home-empty-title">No forms yet</h2>
                        <p className="home-empty-text">
                            Create your first form to get started
                        </p>
                        <button
                            onClick={createNewForm}
                            className="btn-new-form"
                        >
                            <Plus />
                            Create Form
                        </button>
                    </div>
                ) : (
                    <div>
                        {/* <h2 className="home-section-title">Recent Forms</h2> */}
                        <div className="forms-container">
                        <div className="forms-grid">
                            {forms.map((form) => (
                                <div
                                    key={form.id}
                                    className="form-card"
                                >
                                    <div className="form-card-header">
  <div className="form-card-top">
    <div className="form-card-icon">
      <FileText />
    </div>

    <h3 className="form-card-title">
      {form.title}
    </h3>
  </div>

  <div className="form-card-actions">
    <button
      onClick={(e) => duplicateForm(form.id, e)}
      className="btn-icon"
      title="Duplicate"
    >
      <Copy />
    </button>
    <button
      onClick={(e) => deleteForm(form.id, e)}
      className="btn-icon"
      title="Delete"
    >
      <Trash2 />
    </button>
  </div>
</div>

<p className="form-card-description">
  {form.description || "No description"}
</p>

                                    {/* <h3 className="form-card-title">
                                        {form.title}
                                    </h3>
                                    <p className="form-card-description">
                                        {form.description || "No description"}
                                    </p> */}
                                    <div className="form-card-meta">
                                        <span>{form.questions} questions</span>
                                        <span>
                                            {new Date(
                                                form.createdAt,
                                            ).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div className="form-card-footer">
                                        <Link
                                            // href={`/builder/${form.id}`}
                                            href={`/FormBuilder/${form.id}`}
                                            className="btn-edit"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <FileText />
                                            Edit
                                        </Link>
                                        <Link
                                            // href={`/preview/${form.id}`}
                                            href={`/FormPreview/${form.id}`}
                                            className="btn-preview"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <Eye />
                                            Preview
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    )
}

export default page
