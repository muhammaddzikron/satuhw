import users1 from './initialData/usersPart1.json';
import users2 from './initialData/usersPart2.json';
import users3 from './initialData/usersPart3.json';
import training from './initialData/training.json';
import materi from './initialData/materi.json';
import contents from './initialData/contents.json';

const users = [...users1, ...users2, ...users3];

export const INITIAL_SPREADSHEET_DATA = {
  users,
  materi,
  contents,
  kta: users,
  training
};
