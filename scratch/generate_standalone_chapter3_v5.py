import os
from docx import Document
from docx.shared import Inches, Pt
from docx.enum.text import WD_ALIGN_PARAGRAPH

def generate_standalone_chapter():
    output_path = "/home/usain/Bureau/Chapitre_III_Complet_Officiel.docx"
    print(f"Génération d'un document autonome V5 : {output_path}")

    try:
        doc = Document()
        fig_counter = 1
        
        doc.add_heading("III. PRESENTATION DE L'APPLICATION", level=1)
        doc.add_heading("III.1 Modélisation et conception", level=2)
        
        # A. UML
        doc.add_heading("A. UML", level=3)
        doc.add_paragraph(
            "Le langage UML (Unified Modeling Language) est utilisé dans ce projet pour représenter "
            "le système de gestion d'absences et ses différents composants de manière standardisée "
            "et visuelle. Il permet de modéliser les processus métiers, les interactions entre les "
            "différents acteurs (administrateurs, enseignants, étudiants) et l'architecture globale "
            "de l'application."
        )

        # B. Diagramme de cas d'utilisation
        doc.add_heading("B. Diagramme de cas d'utilisation", level=3)
        doc.add_paragraph(
            "Ces diagrammes présentent les interactions principales entre les acteurs et le système. "
            "L'administrateur gère le système de bout en bout, l'enseignant consulte les absences "
            "et pilote les séances, tandis que l'étudiant consulte sa situation. Le système lui-même "
            "intervient en tant qu'acteur autonome pour reconnaître automatiquement les visages via "
            "l'intelligence artificielle."
        )
        
        uc_dir = "/home/usain/Bureau/FaceAttend/docs/diagrams/cas_utilisation"
        uc_files = [
            ("uc_admin_utilisateurs.png", "diagramme de cas d'utilisation de l'Administrateur (Gestion Utilisateurs)"),
            ("uc_admin_entites_operations.png", "diagramme de cas d'utilisation de l'Administrateur (Opérations Système)"),
            ("uc_enseignant_final.png", "diagramme de cas d'utilisation de l'Enseignant"),
            ("uc_etudiant_final.png", "diagramme de cas d'utilisation de l'Étudiant"),
            ("uc_camera_ia.png", "diagramme de cas d'utilisation de la Caméra IA (Système)")
        ]
        
        for filename, caption_text in uc_files:
            path = os.path.join(uc_dir, filename)
            if os.path.exists(path):
                # Image
                p_img = doc.add_paragraph()
                p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
                p_img.paragraph_format.space_after = Pt(2)
                p_img.paragraph_format.keep_with_next = True
                p_img.add_run().add_picture(path, width=Inches(4.8))
                
                # Légende
                p_cap = doc.add_paragraph()
                p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
                p_cap.paragraph_format.space_before = Pt(0)
                p_cap.paragraph_format.space_after = Pt(0)
                p_cap.paragraph_format.keep_with_next = True
                p_cap.add_run(f"Figure n° {fig_counter} : {caption_text}").bold = True
                
                # Source
                p_src = doc.add_paragraph()
                p_src.alignment = WD_ALIGN_PARAGRAPH.CENTER
                p_src.paragraph_format.space_before = Pt(0)
                p_src.paragraph_format.space_after = Pt(18)
                run_source = p_src.add_run("Source : L'auteur")
                run_source.font.size = Pt(8)
                
                fig_counter += 1

        # C. Diagrammes de séquence
        doc.add_heading("C. Diagrammes de séquence", level=3)
        doc.add_paragraph(
            "Les diagrammes de séquence décrivent le déroulement des actions dans le temps pour "
            "les opérations clés. Par exemple, lors de l'émargement, la caméra capture le visage "
            "de l'étudiant, le système analyse l'image via FaceNet pour vérifier la vivacité "
            "(anti-spoofing), identifie l'étudiant dans la base de données, et enregistre "
            "automatiquement sa présence."
        )
        
        seq_dir = "/home/usain/Bureau/FaceAttend/docs/diagrams/sequences_detaillees"
        seq_files = [
            ("seq_creer_seance.png", "diagramme de séquence de Création et ouverture d'une séance"),
            ("seq_ajouter.png", "diagramme de séquence de Ajouter un utilisateur"),
            ("seq_rechercher.png", "diagramme de séquence de Rechercher un utilisateur"),
            ("seq_modifier.png", "diagramme de séquence de Modifier utilisateur"),
            ("seq_supprimer.png", "diagramme de séquence de Supprimer un utilisateur")
        ]
        
        for filename, caption_text in seq_files:
            path = os.path.join(seq_dir, filename)
            if os.path.exists(path):
                p_img = doc.add_paragraph()
                p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
                p_img.paragraph_format.space_after = Pt(2)
                p_img.paragraph_format.keep_with_next = True
                p_img.add_run().add_picture(path, width=Inches(4.8))
                
                p_cap = doc.add_paragraph()
                p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
                p_cap.paragraph_format.space_before = Pt(0)
                p_cap.paragraph_format.space_after = Pt(0)
                p_cap.paragraph_format.keep_with_next = True
                p_cap.add_run(f"Figure n° {fig_counter} : {caption_text}").bold = True
                
                p_src = doc.add_paragraph()
                p_src.alignment = WD_ALIGN_PARAGRAPH.CENTER
                p_src.paragraph_format.space_before = Pt(0)
                p_src.paragraph_format.space_after = Pt(18)
                run_source = p_src.add_run("Source : L'auteur")
                run_source.font.size = Pt(8)
                
                fig_counter += 1

        # D. Diagramme de classes
        doc.add_heading("D. Diagramme de classes", level=3)
        doc.add_paragraph(
            "Le diagramme de classes présente la structure de données et les relations entre "
            "les différentes entités du système. Il met en évidence les classes principales "
            "telles que l'utilisateur (administrateur), l'étudiant, l'enseignant, la séance, "
            "le record de présence/absence, l'alerte d'absence, et le module de reconnaissance "
            "faciale (IA)."
        )
        
        class_diag = "/home/usain/Bureau/FaceAttend/docs/diagrams/conception/diagramme_classe.png"
        if os.path.exists(class_diag):
            p_img = doc.add_paragraph()
            p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p_img.paragraph_format.space_after = Pt(2)
            p_img.paragraph_format.keep_with_next = True
            p_img.add_run().add_picture(class_diag, width=Inches(4.8))
            
            p_cap = doc.add_paragraph()
            p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p_cap.paragraph_format.space_before = Pt(0)
            p_cap.paragraph_format.space_after = Pt(0)
            p_cap.paragraph_format.keep_with_next = True
            p_cap.add_run(f"Figure n° {fig_counter} : diagramme de classes du système FaceAttend.").bold = True
            
            p_src = doc.add_paragraph()
            p_src.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p_src.paragraph_format.space_before = Pt(0)
            p_src.paragraph_format.space_after = Pt(18)
            run_source = p_src.add_run("Source : L'auteur")
            run_source.font.size = Pt(8)
            
            fig_counter += 1

        # E. Analyse fonctionnelle et non fonctionnelle
        doc.add_heading("E. Analyse fonctionnelle et non fonctionnelle", level=3)
        
        # Exigences fonctionnelles
        p_func = doc.add_paragraph()
        p_func.add_run("Exigences fonctionnelles").bold = True
        doc.add_paragraph("Le système a été conçu pour répondre aux besoins suivants :")
        req_func = [
            "Capturer le visage de l'étudiant en temps réel via une caméra en salle.",
            "Analyser l'image pour vérifier la présence humaine (anti-spoofing).",
            "Identifier l'étudiant de manière unique par extraction de caractéristiques biométriques (FaceNet).",
            "Enregistrer automatiquement la présence de l'étudiant dans la base de données liée à la séance en cours.",
            "Permettre à l'enseignant de consulter, valider et modifier les absences de ses étudiants.",
            "Permettre à l'étudiant d'accéder à son espace pour consulter le récapitulatif de ses absences par matière."
        ]
        for req in req_func:
            doc.add_paragraph(f"• {req}")
            
        doc.add_paragraph()
        
        # Exigences non fonctionnelles
        p_non_func = doc.add_paragraph()
        p_non_func.add_run("Exigences non fonctionnelles").bold = True
        doc.add_paragraph("Pour garantir une qualité de service optimale, le système doit satisfaire les critères suivants :")
        req_non_func = [
            "Rapidité : L'identification et l'enregistrement de la présence doivent se faire en une fraction de seconde pour éviter les files d'attente.",
            "Sécurité : Les données biométriques (vecteurs faciaux) et personnelles doivent être protégées et inaccessibles aux personnes non autorisées.",
            "Fiabilité : Le système doit minimiser les faux positifs et faux négatifs, tout en détectant les tentatives de fraude (photos, vidéos).",
            "Facilité d'utilisation (Ergonomie) : Les interfaces doivent être intuitives pour tous les acteurs, sans nécessité de formation technique.",
            "Précision de reconnaissance faciale : L'algorithme d'IA doit offrir un haut taux d'exactitude même avec des variations d'éclairage ou de pose."
        ]
        for req in req_non_func:
            doc.add_paragraph(f"• {req}")

        doc.save(output_path)
        print("Fichier regénéré avec espacement réparé (Keep_with_next) !")

    except Exception as e:
        print(f"Erreur : {e}")

if __name__ == "__main__":
    generate_standalone_chapter()
