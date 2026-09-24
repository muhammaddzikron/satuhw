import users1 from './initialData/usersPart1.json';
import users2 from './initialData/usersPart2.json';
import users3 from './initialData/usersPart3.json';
import { INITIAL_REGISTERED_APPLICANTS, getRegisteredApplicantsAsUsers } from './registeredApplicants';
import training from './initialData/training.json';
import materi from './initialData/materi.json';
import contents from './initialData/contents.json';

const registeredUsers = getRegisteredApplicantsAsUsers();
const users = [...registeredUsers, ...users1, ...users2, ...users3];

export const INITIAL_SPREADSHEET_DATA = {
  users,
  materi,
  contents,
  kta: [...INITIAL_REGISTERED_APPLICANTS, ...users],
  training
};
