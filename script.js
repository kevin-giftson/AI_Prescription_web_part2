// Global variable to store the current row being edited
let currentRow = null;
let medicationCounter = 0; // To keep track of S.No

// Define medication type categories for logic
const INTERNAL_LIQUID_TYPES = ['Syrup', 'Injection', 'Insulin', 'Mixtures', 'Drops', 'Oral Gel', 'Oral Hygiene', 'Serum', 'Solution'];
const SOLID_TYPES = ['Tablet', 'Capsule', 'Powder', 'Lozenges'];
const FREE_FORM_TYPES = ['Lotion', 'Ointment', 'Cream', 'Inhaler', 'Soap', 'Shampoo', 'Gel'];

// Combine types that require the dosage modal
const REQUIRES_DOSAGE_MODAL = [...INTERNAL_LIQUID_TYPES, ...SOLID_TYPES];

document.addEventListener('DOMContentLoaded', function() {
    const medicationTableBody = document.querySelector('#medicationTable tbody');
    const addMedicationBtn = document.getElementById('addMedicationBtn');
    const dosageModal = new bootstrap.Modal(document.getElementById('dosageModal'));
    const saveDosageBtn = document.getElementById('saveDosageBtn');
    const getSuggestionsBtn = document.getElementById('getSuggestionsBtn');
    const aiLoadingSpinner = document.getElementById('aiLoadingSpinner');
    const aiFindingsChips = document.getElementById('aiFindingsChips');
    const aiMedicationChips = document.getElementById('aiMedicationChips');
    const aiLabTestChips = document.getElementById('aiLabTestChips');
    const noFindingsMessage = document.getElementById('noFindingsMessage');
    const noMedicationsMessage = document.getElementById('noMedicationsMessage');
    const noLabTestsMessage = document.getElementById('noLabTestsMessage');

    // PDF generation buttons
    const previewPrescriptionBtn = document.getElementById('previewPrescriptionBtn');
    const downloadPrescriptionBtn = document.getElementById('downloadPrescriptionBtn');
    const loadingPdf = document.getElementById('loadingPdf');
    const pdfContentDiv = document.getElementById('pdfContent');

    // Modal elements
    const morningDoseCheck = document.getElementById('morningDoseCheck');
    const morningQty = document.getElementById('morningQty');
    const morningUnit = document.getElementById('morningUnit');
    const morningFoodTiming = document.getElementById('morningFoodTiming');
    const lunchDoseCheck = document.getElementById('lunchDoseCheck');
    const lunchQty = document.getElementById('lunchQty');
    const lunchUnit = document.getElementById('lunchUnit');
    const lunchFoodTiming = document.getElementById('lunchFoodTiming');
    const nightDoseCheck = document.getElementById('nightDoseCheck');
    const nightQty = document.getElementById('nightQty');
    const nightUnit = document.getElementById('nightUnit');
    const nightFoodTiming = document.getElementById('nightFoodTiming');

    // Function to add a medication row to the table
    function addMedicationRow(name = '', type = 'Tablet', duration = '', instructions = '') {
        medicationCounter++;
        const newRow = document.createElement('tr');
        newRow.dataset.sno = medicationCounter;
        newRow.innerHTML = `
            <td>${medicationCounter}</td>
            <td><input type="text" class="form-control" value="${name}"></td>
            <td>
                <select class="form-select medication-type">
                    <option value="Tablet" ${type === 'Tablet' ? 'selected' : ''}>Tablet</option>
                    <option value="Syrup" ${type === 'Syrup' ? 'selected' : ''}>Syrup</option>
                    <option value="Capsule" ${type === 'Capsule' ? 'selected' : ''}>Capsule</option>
                    <option value="Lotion" ${type === 'Lotion' ? 'selected' : ''}>Lotion</option>
                    <option value="Ointment" ${type === 'Ointment' ? 'selected' : ''}>Ointment</option>
                    <option value="Cream" ${type === 'Cream' ? 'selected' : ''}>Cream</option>
                    <option value="Inhaler" ${type === 'Inhaler' ? 'selected' : ''}>Inhaler</option>
                    <option value="Injection" ${type === 'Injection' ? 'selected' : ''}>Injection</option>
                    <option value="Drops" ${type === 'Drops' ? 'selected' : ''}>Drops</option>
                    <option value="Insulin" ${type === 'Insulin' ? 'selected' : ''}>Insulin</option>
                    <option value="Powder" ${type === 'Powder' ? 'selected' : ''}>Powder</option>
                    <option value="Soap" ${type === 'Soap' ? 'selected' : ''}>Soap</option>
                    <option value="Shampoo" ${type === 'Shampoo' ? 'selected' : ''}>Shampoo</option>
                    <option value="Gel" ${type === 'Gel' ? 'selected' : ''}>Gel</option>
                    <option value="Oral Gel" ${type === 'Oral Gel' ? 'selected' : ''}>Oral Gel</option>
                    <option value="Oral Hygiene" ${type === 'Oral Hygiene' ? 'selected' : ''}>Oral Hygiene</option>
                    <option value="Serum" ${type === 'Serum' ? 'selected' : ''}>Serum</option>
                    <option value="Solution" ${type === 'Solution' ? 'selected' : ''}>Solution</option>
                    <option value="Mixtures" ${type === 'Mixtures' ? 'selected' : ''}>Mixtures</option>
                    <option value="Lozenges" ${type === 'Lozenges' ? 'selected' : ''}>Lozenges</option>
                </select>
            </td>
            <td><button class="btn btn-sm btn-outline-primary dosage-btn">Set Dosage</button></td>
            <td><input type="text" class="form-control" value="${duration}"></td>
            <td><input type="text" class="form-control" value="${instructions}"></td>
            <td><button class="btn btn-sm btn-danger delete-row-btn">Delete</button></td>
        `;
        medicationTableBody.appendChild(newRow);
        // Add event listeners for the new row
        newRow.querySelector('.dosage-btn').addEventListener('click', handleDosageButtonClick);
        newRow.querySelector('.delete-row-btn').addEventListener('click', handleDeleteRow);
    }

    // Function to handle the dosage button click
    function handleDosageButtonClick(event) {
        currentRow = event.target.closest('tr');
        const medicationType = currentRow.querySelector('.medication-type').value;

        // Reset modal fields
        morningDoseCheck.checked = false; morningQty.value = 0; morningUnit.value = '';
        lunchDoseCheck.checked = false; lunchQty.value = 0; lunchUnit.value = '';
        nightDoseCheck.checked = false; nightQty.value = 0; nightUnit.value = '';

        // Determine which unit input to show
        const unit = (INTERNAL_LIQUID_TYPES.includes(medicationType)) ? 'ml' : 'tab';
        document.querySelectorAll('.unit-input').forEach(input => {
            input.style.display = 'block';
            input.value = unit;
        });

        // Set the values from the existing instructions if they exist
        const instructions = currentRow.querySelector('td:nth-child(6) input').value;
        // Simple parsing logic (can be more robust)
        if (instructions.includes('Morning:')) {
            morningDoseCheck.checked = true;
            morningQty.value = instructions.split('Morning:')[1].split('(')[0].trim().split(' ')[0];
        }
        if (instructions.includes('Lunch:')) {
            lunchDoseCheck.checked = true;
            lunchQty.value = instructions.split('Lunch:')[1].split('(')[0].trim().split(' ')[0];
        }
        if (instructions.includes('Night:')) {
            nightDoseCheck.checked = true;
            nightQty.value = instructions.split('Night:')[1].split('(')[0].trim().split(' ')[0];
        }

        dosageModal.show();
    }

    // Function to handle the delete button click
    function handleDeleteRow(event) {
        if (confirm('Are you sure you want to delete this medication row?')) {
            const row = event.target.closest('tr');
            row.remove();
            reorganizeMedicationSno();
        }
    }

    // Function to reorganize S.No after a row is deleted
    function reorganizeMedicationSno() {
        const rows = medicationTableBody.querySelectorAll('tr');
        medicationCounter = 0;
        rows.forEach((row, index) => {
            medicationCounter++;
            row.dataset.sno = medicationCounter;
            row.querySelector('td:first-child').textContent = medicationCounter;
        });
    }

    // Event listener for the save dosage button
    saveDosageBtn.addEventListener('click', function() {
        if (!currentRow) return;

        let instructions = [];
        const units = currentRow.querySelector('.medication-type').value === 'Syrup' ? 'ml' : 'tab';

        if (morningDoseCheck.checked) {
            instructions.push(`Morning: ${morningQty.value} ${units} (${morningFoodTiming.value})`);
        }
        if (lunchDoseCheck.checked) {
            instructions.push(`Lunch: ${lunchQty.value} ${units} (${lunchFoodTiming.value})`);
        }
        if (nightDoseCheck.checked) {
            instructions.push(`Night: ${nightQty.value} ${units} (${nightFoodTiming.value})`);
        }

        currentRow.querySelector('td:nth-child(6) input').value = instructions.join(', ');
        dosageModal.hide();
    });

    // --- AI Suggestion Logic ---
    getSuggestionsBtn.addEventListener('click', async function() {
        // 1. Gather all form data
        const patientName = document.getElementById('patientName').value;
        const age = document.getElementById('age').value;
        const gender = document.getElementById('gender').value;
        const weight = document.getElementById('weight').value;
        const bloodPressure = document.getElementById('bloodPressure').value;
        const temperature = document.getElementById('temperature').value;
        const symptoms = document.getElementById('symptoms').value;
        const medicalHistory = document.getElementById('medicalHistory').value;
        const findings = document.getElementById('findings').value;
        const labTests = document.getElementById('labTests').value;
        const medicationRows = Array.from(document.querySelectorAll('#medicationTable tbody tr')).map(row => {
            return {
                name: row.querySelector('td:nth-child(2) input').value,
                type: row.querySelector('td:nth-child(3) select').value,
                duration: row.querySelector('td:nth-child(5) input').value,
                instructions: row.querySelector('td:nth-child(6) input').value
            };
        });

        // 2. Construct a clear, structured prompt for the AI
        const patientInfoPrompt = `
            You are a helpful medical assistant. Based on the following patient information, provide suggestions for findings, medications, and lab tests.
            
            Return the suggestions in a JSON object with three arrays: 'findings', 'medications', and 'labTests'. Each item in the array should have a 'title' and a 'description'. Do not include any text outside of the JSON.

            Patient Information:
            - Name: ${patientName || 'N/A'}
            - Age: ${age || 'N/A'}
            - Gender: ${gender || 'N/A'}
            - Weight: ${weight || 'N/A'} kg
            - Blood Pressure: ${bloodPressure || 'N/A'} mmHg
            - Temperature: ${temperature || 'N/A'} °C

            Symptoms:
            ${symptoms || 'N/A'}

            Past Medical History:
            ${medicalHistory || 'N/A'}

            Existing Medications:
            ${medicationRows.length > 0 ? medicationRows.map(m => ` - ${m.name} (${m.instructions})`).join('\n') : 'N/A'}

            Existing Findings:
            ${findings || 'N/A'}

            Existing Lab Tests:
            ${labTests || 'N/A'}
        `;

        // 3. Show loading spinner
        aiLoadingSpinner.style.display = 'block';
        
        // Clear previous suggestions
        aiFindingsChips.innerHTML = '';
        aiMedicationChips.innerHTML = '';
        aiLabTestChips.innerHTML = '';

        try {
            const response = await fetch('/get-suggestions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ patientInfoPrompt }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const result = await response.json();
            const aiSuggestions = JSON.parse(result.candidates[0].content.parts[0].text);
            
            // 4. Display the suggestions
            displaySuggestions(aiSuggestions);

        } catch (error) {
            console.error('Error fetching AI suggestions:', error);
            // Display an error message to the user
            aiFindingsChips.innerHTML = `<p class="text-danger text-center">Failed to get suggestions. Please check the console for details.</p>`;
        } finally {
            // 5. Hide loading spinner
            aiLoadingSpinner.style.display = 'none';
        }
    });

    // Function to display the parsed AI suggestions
    function displaySuggestions(suggestions) {
        // Display Findings
        if (suggestions.findings && suggestions.findings.length > 0) {
            noFindingsMessage.style.display = 'none';
            suggestions.findings.forEach(item => {
                const chip = createChip(item.title, item.description, 'findings');
                aiFindingsChips.appendChild(chip);
            });
        } else {
            noFindingsMessage.style.display = 'block';
        }

        // Display Medications
        if (suggestions.medications && suggestions.medications.length > 0) {
            noMedicationsMessage.style.display = 'none';
            suggestions.medications.forEach(item => {
                const chip = createChip(item.title, item.description, 'medications');
                aiMedicationChips.appendChild(chip);
            });
        } else {
            noMedicationsMessage.style.display = 'block';
        }

        // Display Lab Tests
        if (suggestions.labTests && suggestions.labTests.length > 0) {
            noLabTestsMessage.style.display = 'none';
            suggestions.labTests.forEach(item => {
                const chip = createChip(item.title, item.description, 'labTests');
                aiLabTestChips.appendChild(chip);
            });
        } else {
            noLabTestsMessage.style.display = 'block';
        }
    }

    // Function to create a suggestion chip with its own click handler
    function createChip(title, description, type) {
        const chip = document.createElement('span');
        chip.className = 'chip';
        chip.textContent = title;
        chip.title = description; // Use the description for the tooltip
        chip.dataset.description = description;

        chip.addEventListener('click', () => {
            if (type === 'findings') {
                const findingsInput = document.getElementById('findings');
                const currentVal = findingsInput.value.trim();
                findingsInput.value = currentVal ? `${currentVal}, ${title}` : title;
            } else if (type === 'labTests') {
                const labTestsInput = document.getElementById('labTests');
                const currentVal = labTestsInput.value.trim();
                labTestsInput.value = currentVal ? `${currentVal}, ${title}` : title;
            } else if (type === 'medications') {
                // For medications, add a new row to the table
                const [medName, medType] = parseMedicationTitle(title);
                const [duration, instructions] = parseMedicationDescription(description);
                addMedicationRow(medName, medType, duration, instructions);
            }
        });
        return chip;
    }

    // Helper function to parse medication title (e.g., "Amoxicillin (Capsule)")
    function parseMedicationTitle(title) {
        const parts = title.split('(');
        const name = parts[0].trim();
        const type = parts.length > 1 ? parts[1].replace(')', '').trim() : 'Tablet'; // Default to Tablet
        return [name, type];
    }

    // Helper function to parse medication description for duration and instructions
    function parseMedicationDescription(description) {
        const durationMatch = description.match(/Duration:\s*(.*?)(\.|$)/i);
        const instructionsMatch = description.match(/Instructions:\s*(.*?)(\.|$)/i);
        const duration = durationMatch ? durationMatch[1].trim() : '';
        const instructions = instructionsMatch ? instructionsMatch[1].trim() : '';
        return [duration, instructions];
    }
    
    // Function to get all patient and medication data for PDF generation
    function getPdfContent() {
        const patientName = document.getElementById('patientName').value || 'N/A';
        const age = document.getElementById('age').value || 'N/A';
        const gender = document.getElementById('gender').value || 'N/A';
        const weight = document.getElementById('weight').value || 'N/A';
        const bloodPressure = document.getElementById('bloodPressure').value || 'N/A';
        const temperature = document.getElementById('temperature').value || 'N/A';
        const symptoms = document.getElementById('symptoms').value || 'N/A';
        const medicalHistory = document.getElementById('medicalHistory').value || 'N/A';
        const findings = document.getElementById('findings').value || 'N/A';
        const labTests = document.getElementById('labTests').value || 'N/A';
        const dateOfVisit = document.getElementById('dateOfVisit').value || 'N/A';
        const doctorName = document.getElementById('doctorName').value || 'N/A';
        const specialty = document.getElementById('specialty').value || 'N/A';
        const email = document.getElementById('email').value || 'N/A';
        const phoneNumber = document.getElementById('phoneNumber').value || 'N/A';
        const nextFollowupDate = document.getElementById('nextFollowupDate').value || 'N/A';

        const medicationRows = Array.from(document.querySelectorAll('#medicationTable tbody tr')).map(row => {
            const cells = row.querySelectorAll('td');
            return {
                sno: cells[0].textContent,
                name: cells[1].querySelector('input').value,
                type: cells[2].querySelector('select').value,
                dosage: cells[3].querySelector('button').textContent,
                duration: cells[4].querySelector('input').value,
                instructions: cells[5].querySelector('input').value
            };
        });

        // Constructing the HTML content for the PDF
        let medicationsHtml = '';
        if (medicationRows.length > 0) {
            medicationsHtml = `
                <h3 class="section-title">Medications</h3>
                <div class="table-responsive">
                    <table class="table table-bordered pdf-table">
                        <thead>
                            <tr>
                                <th>S.No</th>
                                <th>Name, Dosage, Type</th>
                                <th>Duration</th>
                                <th>Instructions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${medicationRows.map(m => `
                                <tr>
                                    <td>${m.sno}</td>
                                    <td>${m.name}, ${m.dosage}, ${m.type}</td>
                                    <td>${m.duration}</td>
                                    <td>${m.instructions}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        }

        return `
            <div id="prescription-content" class="pdf-container">
                <div class="header">
                    <img src="https://placehold.co/100x100/1ea69a/ffffff?text=Logo" alt="Logo" class="logo">
                    <div class="title-container">
                        <h2>Patient Prescription</h2>
                        <p class="subtitle">Generated by AI Prescription Maker</p>
                    </div>
                </div>
                <div class="patient-info section">
                    <h3 class="section-title">Patient Information</h3>
                    <div class="info-grid">
                        <p><strong>Date:</strong> ${dateOfVisit}</p>
                        <p><strong>Patient Name:</strong> ${patientName}</p>
                        <p><strong>Age:</strong> ${age}</p>
                        <p><strong>Gender:</strong> ${gender}</p>
                        <p><strong>Weight:</strong> ${weight}</p>
                        <p><strong>Blood Pressure:</strong> ${bloodPressure}</p>
                        <p><strong>Temperature:</strong> ${temperature}</p>
                    </div>
                </div>
                <div class="section">
                    <h3 class="section-title">Symptoms</h3>
                    <p>${symptoms}</p>
                </div>
                <div class="section">
                    <h3 class="section-title">Past Medical History</h3>
                    <p>${medicalHistory}</p>
                </div>
                <div class="section">
                    <h3 class="section-title">Findings</h3>
                    <p>${findings}</p>
                </div>
                ${medicationsHtml}
                <div class="section">
                    <h3 class="section-title">Lab Tests</h3>
                    <p>${labTests}</p>
                </div>
                <div class="doctor-info section">
                    <h3 class="section-title">Doctor Information</h3>
                    <div class="info-grid">
                        <p><strong>Doctor Name:</strong> ${doctorName}</p>
                        <p><strong>Specialty:</strong> ${specialty}</p>
                        <p><strong>Email:</strong> ${email}</p>
                        <p><strong>Phone Number:</strong> ${phoneNumber}</p>
                        <p><strong>Next Followup Date:</strong> ${nextFollowupDate}</p>
                    </div>
                </div>
                <div class="signature">
                    <p>Signature: _________________________</p>
                </div>
            </div>
        `;
    }

    // Function to generate and open the PDF
    async function generateAndOpenPdf(action) {
        if (loadingPdf) {
            loadingPdf.style.display = 'block';
        }
    
        // Generate content for PDF
        const content = getPdfContent();
        if (pdfContentDiv) {
            pdfContentDiv.innerHTML = content;
            // PDF styles
            const pdfStyles = `
                <style>
                    body { font-family: 'Inter', sans-serif; margin: 0; padding: 0; }
                    .pdf-container { width: 8.5in; height: 11in; padding: 0.5in; box-sizing: border-box; background-color: white; color: #333; }
                    .header { display: flex; align-items: center; border-bottom: 2px solid #1ea69a; padding-bottom: 10px; margin-bottom: 20px; }
                    .logo { max-width: 80px; height: auto; border-radius: 8px; }
                    .title-container { flex-grow: 1; text-align: center; }
                    .title-container h2 { margin: 0; color: #1ea69a; font-size: 1.8em; }
                    .title-container .subtitle { margin: 0; color: #57bcb3; font-size: 0.9em; }
                    .section { margin-bottom: 20px; }
                    .section-title { color: #1ea69a; border-bottom: 1px solid #57bcb3; padding-bottom: 5px; margin-bottom: 10px; font-size: 1.2em; font-weight: 600; }
                    .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
                    .info-grid p { margin: 0; }
                    .pdf-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                    .pdf-table th, .pdf-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    .pdf-table th { background-color: #f2f2f2; color: #333; }
                    .signature { margin-top: 50px; text-align: right; }
                    @media print {
                        body { -webkit-print-color-adjust: exact; }
                        .pdf-container { box-shadow: none; }
                        .header { border-bottom-color: #1ea69a !important; }
                        .section-title { border-bottom-color: #57bcb3 !important; }
                    }
                </style>
            `;
            const combinedHtml = pdfStyles + pdfContentDiv.innerHTML;
            pdfContentDiv.innerHTML = combinedHtml;
        }
    
        const filename = `Prescription_${document.getElementById('patientName').value.replace(/\s/g, '_') || 'Patient'}_${new Date().toISOString().slice(0, 10)}.pdf`;
    
        // A temporary fix to allow html2canvas to render the hidden content properly
        pdfContentDiv.style.position = 'static';
        pdfContentDiv.style.opacity = '1';
        pdfContentDiv.style.zIndex = '9999';
    
        // Wait for images to load, if any
        await new Promise(resolve => setTimeout(resolve, 500));
    
        try {
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF('p', 'pt', 'a4', true);
            const contentWidth = pdf.internal.pageSize.getWidth();
            const contentHeight = pdf.internal.pageSize.getHeight();
            const margin = 20;
    
            const canvas = await html2canvas(pdfContentDiv, {
                scale: 2,
                useCORS: true,
                allowTaint: true,
                windowWidth: pdfContentDiv.scrollWidth,
                windowHeight: pdfContentDiv.scrollHeight
            });
    
            const imgData = canvas.toDataURL('image/png');
            const imgWidth = contentWidth - 2 * margin;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
            let position = 0;
    
            // Adding the image of the HTML content to the PDF
            pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight, null, 'FAST');
    
            if (action === 'preview') {
                const pdfUrl = pdf.output('bloburl');
                window.open(pdfUrl, '_blank');
                console.log("PDF opened in new tab for preview using Object URL.");
                setTimeout(() => URL.revokeObjectURL(pdfUrl), 5000); // Clean up URL
            } else if (action === 'download') {
                pdf.save(filename);
                console.log("PDF download initiated successfully.");
            }
        } catch (error) {
            console.error(`Error during PDF generation (${action}):`, error);
            if (loadingPdf) {
                loadingPdf.innerHTML = `<p class="text-danger">Error ${action}ing PDF: ${error.message || error}.</p>`;
            }
        } finally {
            if (loadingPdf) {
                loadingPdf.style.display = 'none'; // Hide loading spinner
            }
            // Reset the hidden div's styles
            if (pdfContentDiv) {
                pdfContentDiv.style.position = 'absolute'; // Back to original
                pdfContentDiv.style.left = '-9999px';
                pdfContentDiv.style.top = '-9999px';
                pdfContentDiv.style.opacity = '0'; // Hide it again
            }
        }
    }

    // Event listeners for Preview and Download buttons
    previewPrescriptionBtn.addEventListener('click', () => generateAndOpenPdf('preview'));
    downloadPrescriptionBtn.addEventListener('click', () => generateAndOpenPdf('download'));

    // Initial row on page load
    addMedicationRow();

    // Event listener for "Add Medication" button
    addMedicationBtn.addEventListener('click', addMedicationRow);

    // Add click listeners for pre-defined chips
    document.getElementById('symptomChips').addEventListener('click', function(e) {
        if (e.target.classList.contains('chip')) {
            const symptomInput = document.getElementById('symptoms');
            const currentVal = symptomInput.value.trim();
            symptomInput.value = currentVal ? `${currentVal}, ${e.target.textContent}` : e.target.textContent;
        }
    });

    document.getElementById('historyChips').addEventListener('click', function(e) {
        if (e.target.classList.contains('chip')) {
            const historyInput = document.getElementById('medicalHistory');
            const currentVal = historyInput.value.trim();
            historyInput.value = currentVal ? `${currentVal}, ${e.target.textContent}` : e.target.textContent;
        }
    });

    document.getElementById('labTestChips').addEventListener('click', function(e) {
        if (e.target.classList.contains('chip')) {
            const labTestInput = document.getElementById('labTests');
            const currentVal = labTestInput.value.trim();
            labTestInput.value = currentVal ? `${currentVal}, ${e.target.textContent}` : e.target.textContent;
        }
    });
});
