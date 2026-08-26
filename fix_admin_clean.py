with open('src/pages/AdminDashboard.tsx', 'rb') as f:
    raw = f.read()

# Let's clean up lines
text = raw.decode('utf-8', errors='ignore')
lines = text.splitlines()

# 1. Ensure correct imports at top
new_lines = []
for idx, line in enumerate(lines[:9220]):
    if idx == 8:
        new_lines.append("import { syncRolesAndPelatihan, PELATIHAN_OPTIONS, isPelatihanSelected, normalizeTrainingKey, consolidateTrainingApplications, isSameTrainingParticipant, normalizeParticipantName, generateSamplePreTestForParticipants, generateSamplePostTestForParticipants, generateSampleTestSubmissionsForParticipants, getAppPreTestScore, getAppPostTestScore, getAppTasksList, getAppAttendanceMap } from '../utils/trainingUtils';")
    elif idx == 9:
        new_lines.append(line)
        new_lines.append("import { TestSubmissionViewerModal } from '../components/training/TestSubmissionViewerModal';")
    else:
        new_lines.append(line)

# Let's inspect what lines 9210-9220 are in new_lines
print("Lines around 9215 in new_lines:")
for i in range(len(new_lines)-10, len(new_lines)):
    print(f"{i+1}: {new_lines[i]}")

